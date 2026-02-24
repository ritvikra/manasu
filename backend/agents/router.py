import re
from datetime import datetime
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from models.state import AgentState
from agents.tools import read_recent_imessages, send_imessage
from services.settings_service import get_settings

TOOLS = [read_recent_imessages, send_imessage]

# --- keyword gate ---------------------------------------------------------
# These patterns must match before we ever pass tools to the LLM.
# If NONE match, the message is treated as general chat.
_TOOL_PATTERNS = [
    r"\bread\b.{0,40}\b(message|text|imessage|chat)\b",
    r"\bshow\b.{0,40}\b(message|text|imessage)\b",
    r"\bcheck\b.{0,40}\b(message|text|imessage)\b",
    r"\bwhat did\b.{0,40}\bsay\b",
    r"\blast\b.{0,20}\b(message|text|imessage)\b",
    r"\brecent\b.{0,20}\b(message|text|imessage)\b",
    r"\bany (new )?message",
    r"\bsend\b.{0,60}\bto\b.{0,60}(\+\d|@)",  # send X to +number or email
    r"\btext\b.{0,60}\bsaying\b",
    r"\breply\b.{0,40}\bto\b",
    r"\bmessage\b.{0,40}\bfor me\b",
]


def _needs_tools(text: str) -> bool:
    """True only when the message clearly asks to read or send an iMessage."""
    lower = text.lower()
    return any(re.search(p, lower) for p in _TOOL_PATTERNS)


# --- LLM singletons -------------------------------------------------------
_llm_tools: ChatOllama | None = None
_llm_plain: ChatOllama | None = None


def _get_llm_tools() -> ChatOllama:
    global _llm_tools
    if _llm_tools is None:
        s = get_settings()
        # Tool routing always at low temp regardless of user setting
        _llm_tools = ChatOllama(
            model=s["model"], base_url=s["ollama_url"], temperature=0.1
        ).bind_tools(TOOLS)
    return _llm_tools


def _get_llm_plain() -> ChatOllama:
    global _llm_plain
    if _llm_plain is None:
        s = get_settings()
        _llm_plain = ChatOllama(
            model=s["model"], base_url=s["ollama_url"], temperature=s["temperature"]
        )
    return _llm_plain


# --- system prompts -------------------------------------------------------
def _build_tool_system() -> str:
    now = datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")
    return f"""You are Manasu, a private AI assistant on macOS. Today is {now}.

You have been given tools because the user wants to read or send iMessages.

TOOL: read_recent_imessages(contact_name, limit)
  - contact_name: filter by name/number, or leave empty for all contacts
  - limit: how many messages (default 10)

TOOL: send_imessage(recipient, message)
  - recipient: phone number (+1...) or Apple ID email
  - message: the exact text to send
  - Only call this if the user gave you a specific recipient AND specific message text.

Call at most ONE tool. Do not call send_imessage unless you have both a recipient and message text."""


def _build_plain_system() -> str:
    now = datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")
    return f"""You are Manasu, a private AI assistant running locally on macOS. Today is {now}.

You can:
• Read recent iMessages from the user's Messages app
• Send iMessages to a contact by phone number or Apple ID
• Answer general questions and have conversations

Answer the user's question directly and concisely. Do not pretend to use any tools."""


# --- node -----------------------------------------------------------------
def router_node(state: AgentState) -> AgentState:
    """Route: keyword gate decides whether tools are even offered."""
    messages = list(state["messages"])

    # Find the most recent human message to check
    last_human = ""
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            last_human = m.content or ""
            break

    if _needs_tools(last_human):
        llm = _get_llm_tools()
        system = _build_tool_system()
    else:
        llm = _get_llm_plain()
        system = _build_plain_system()

    response = llm.invoke([SystemMessage(content=system)] + messages)
    return {"messages": [response]}
