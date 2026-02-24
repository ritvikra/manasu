from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, ToolMessage
from models.state import AgentState
from services.settings_service import get_settings

_llm: ChatOllama | None = None


def _get_llm() -> ChatOllama:
    global _llm
    if _llm is None:
        s = get_settings()
        _llm = ChatOllama(
            model=s["model"], base_url=s["ollama_url"], temperature=s["temperature"]
        )
    return _llm


DRAFTER_SYSTEM = """You are Manasu. A tool was just called and you have the result. Summarize it for the user.

Rules:
- read_recent_imessages result: present the messages clearly (sender, content). Most recent first.
- send_imessage result: confirm ONLY if the tool result shows success. Say: "Done — I sent '[message]' to [recipient]."
- Tool error: explain what went wrong and how to fix it.
- NEVER claim to have sent a message unless the tool result explicitly confirms it.
- NEVER invent or fabricate any message content or actions not present in the tool result.
- Be concise."""


def drafter_node(state: AgentState) -> AgentState:
    """Synthesize tool results into a final response."""
    llm = _get_llm()
    messages = [SystemMessage(content=DRAFTER_SYSTEM)] + list(state["messages"])
    response = llm.invoke(messages)
    return {"messages": [response]}
