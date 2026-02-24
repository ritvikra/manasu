import re
from datetime import datetime
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
from models.state import AgentState
from agents.tools import send_imessage, send_email

# Exported for supervisor's ToolNode (send operations only)
TOOLS = [send_imessage, send_email]
from services.settings_service import get_settings
from services.document_service import search_documents
from services.imessage_service import read_recent_messages
from services.mail_service import read_recent_emails as _fetch_emails

DOC_TOP_K = 15

# --- tag parsing ----------------------------------------------------------

_TAG_RE = re.compile(r"\[(files|texts|emails)\]", re.IGNORECASE)


def _parse_tags(text: str) -> tuple[set[str], str]:
    """
    Extract leading tags like [files][texts][emails] from the message.
    Returns (set_of_tags, cleaned_message).
    Tags can appear in any order, with optional spaces between them.
    """
    tags: set[str] = set()
    # Consume tags greedily from the front
    pos = 0
    stripped = text.lstrip()
    offset = len(text) - len(stripped)
    pos = offset
    while pos < len(text):
        m = _TAG_RE.match(text, pos)
        if m:
            tags.add(m.group(1).lower())
            pos = m.end()
            # skip whitespace between tags
            while pos < len(text) and text[pos] == " ":
                pos += 1
        else:
            break
    clean = text[pos:].strip()
    return tags, clean


# --- data fetchers --------------------------------------------------------

def _fetch_texts_context() -> str:
    try:
        msgs = read_recent_messages(limit=15)
        if not msgs:
            return "No recent iMessages found."
        if "error" in msgs[0]:
            return msgs[0]["error"]
        lines = []
        for msg in msgs:
            sender = "Me" if msg["is_from_me"] else msg["sender"]
            lines.append(f"[{msg.get('chat_name', '')}] {sender}: {msg['text']}")
        return "\n".join(lines)
    except Exception as e:
        return f"Failed to read iMessages: {e}"


def _fetch_emails_context() -> str:
    try:
        emails = _fetch_emails(mailbox="Inbox", limit=10)
        if not emails:
            return "No emails found in Inbox."
        if "error" in emails[0]:
            return emails[0]["error"]
        parts = []
        for e in emails:
            parts.append(
                f"From: {e.get('sender', '?')}\n"
                f"Subject: {e.get('subject', '(no subject)')}\n"
                f"Date: {e.get('date', '?')}\n"
                f"Body: {e.get('body', '')}"
            )
        return "\n\n---\n\n".join(parts)
    except Exception as e:
        return f"Failed to read emails: {e}"


def _fetch_files_context(query: str) -> str:
    try:
        results = search_documents(query, top_k=DOC_TOP_K)
        if not results:
            return "No relevant document excerpts found."
        parts = [f"[{r['filename']}]\n{r['content']}" for r in results]
        return "\n\n".join(parts)
    except Exception as e:
        return f"Document search failed: {e}"


# --- system prompt builders -----------------------------------------------

def _build_tagged_system(tags: set[str], contexts: dict[str, str]) -> str:
    now = datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")
    lines = [f"You are Manasu, a private AI assistant on macOS. Today is {now}.", ""]

    if "texts" in tags:
        lines += ["=== Recent iMessages ===", contexts.get("texts", ""), ""]
    if "emails" in tags:
        lines += ["=== Recent Emails (Inbox) ===", contexts.get("emails", ""), ""]
    if "files" in tags:
        lines += ["=== Relevant Document Excerpts ===", contexts.get("files", ""), ""]

    lines += [
        "Use the data above to answer the user's question.",
        "If the user wants to SEND a message or email, use the appropriate tool.",
        "If they want to READ or summarize, answer directly from the data above.",
        "Be concise.",
    ]

    if "texts" in tags:
        lines += [
            "",
            "TOOL: send_imessage(recipient, message)",
            "  - Only call if user explicitly wants to send a text and provides recipient + message.",
        ]
    if "emails" in tags:
        lines += [
            "",
            "TOOL: send_email(recipient, subject, body)",
            "  - Only call if user explicitly wants to send an email and provides all three fields.",
        ]

    return "\n".join(lines)


def _build_plain_system() -> str:
    now = datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")
    return f"""You are Manasu, a private AI assistant running locally on macOS. Today is {now}.

Answer the user's question directly and concisely."""


# --- LLM singletons -------------------------------------------------------
_llm_plain: ChatOllama | None = None
_llm_texts: ChatOllama | None = None
_llm_emails: ChatOllama | None = None
_llm_both: ChatOllama | None = None


def _get_llm_plain() -> ChatOllama:
    global _llm_plain
    if _llm_plain is None:
        s = get_settings()
        _llm_plain = ChatOllama(model=s["model"], base_url=s["ollama_url"], temperature=s["temperature"])
    return _llm_plain


def _get_llm_with_tools(tools: list) -> ChatOllama:
    s = get_settings()
    return ChatOllama(model=s["model"], base_url=s["ollama_url"], temperature=0.1).bind_tools(tools)


# --- node -----------------------------------------------------------------

def router_node(state: AgentState) -> AgentState:
    messages = list(state["messages"])

    last_human = ""
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            last_human = m.content or ""
            break

    tags, clean_query = _parse_tags(last_human)

    if not tags:
        # Plain chat — no connectors activated
        llm = _get_llm_plain()
        system = _build_plain_system()
        response = llm.invoke([SystemMessage(content=system)] + messages)
        return {"messages": [response]}

    # Fetch context for each active tag
    contexts: dict[str, str] = {}
    if "texts" in tags:
        contexts["texts"] = _fetch_texts_context()
    if "emails" in tags:
        contexts["emails"] = _fetch_emails_context()
    if "files" in tags:
        contexts["files"] = _fetch_files_context(clean_query or last_human)

    # Build system prompt
    system = _build_tagged_system(tags, contexts)

    # Choose LLM: bind send tools only for the activated connectors
    active_tools = []
    if "texts" in tags:
        active_tools.append(send_imessage)
    if "emails" in tags:
        active_tools.append(send_email)

    if active_tools:
        llm = _get_llm_with_tools(active_tools)
    else:
        llm = _get_llm_plain()

    # Replace the tagged message with the clean query so LLM sees no raw tags
    clean_messages = []
    for m in messages:
        if isinstance(m, HumanMessage) and m.content == last_human:
            clean_messages.append(HumanMessage(content=clean_query or last_human))
        else:
            clean_messages.append(m)

    response = llm.invoke([SystemMessage(content=system)] + clean_messages)
    return {"messages": [response]}
