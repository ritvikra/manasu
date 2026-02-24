from langchain_core.tools import tool
from services.imessage_service import read_recent_messages, send_imessage as _send
from services.mail_service import (
    read_recent_emails as _read_emails,
    send_email as _send_email,
)
from services.document_service import search_documents as _search_docs


@tool
def read_recent_imessages(contact_name: str = "", limit: int = 10) -> str:
    """
    Read recent iMessages from the Messages app.

    Args:
        contact_name: Name or phone number to filter by. Leave empty for all recent messages.
        limit: Number of messages to retrieve (default 10, max 50).
    """
    limit = min(limit, 50)
    messages = read_recent_messages(contact_filter=contact_name, limit=limit)

    if not messages:
        return "No messages found."

    if "error" in messages[0]:
        return messages[0]["error"]

    lines = []
    for msg in messages:
        sender = msg["sender"]
        text = msg["text"]
        chat = msg.get("chat_name", "")
        from_me = "(me)" if msg["is_from_me"] else ""
        lines.append(f"[{chat}] {sender}{from_me}: {text}")

    return "\n".join(lines)


@tool
def send_imessage(recipient: str, message: str) -> str:
    """
    Send an iMessage to a contact.

    Args:
        recipient: Phone number (e.g., +14804941220) or Apple ID email of the recipient.
        message: The message text to send.
    """
    if not recipient or not message:
        return "Error: recipient and message are required."
    return _send(recipient, message)


@tool
def read_recent_emails(mailbox: str = "Inbox", limit: int = 5) -> str:
    """
    Read recent emails from Apple Mail.app.

    Args:
        mailbox: The mailbox to read from, e.g. 'Inbox', 'Sent'. Defaults to 'Inbox'.
        limit: Number of emails to retrieve (default 5, max 50).
    """
    limit = min(limit, 50)
    emails = _read_emails(mailbox=mailbox, limit=limit)

    if not emails:
        return "No emails found."

    if "error" in emails[0]:
        return emails[0]["error"]

    lines = []
    for e in emails:
        lines.append(
            f"From: {e.get('sender', '?')}\n"
            f"Subject: {e.get('subject', '(no subject)')}\n"
            f"Date: {e.get('date', '?')}\n"
            f"Body: {e.get('body', '')}\n"
        )
    return "\n---\n".join(lines)


@tool
def send_email(recipient: str, subject: str, body: str) -> str:
    """
    Send an email via Apple Mail.app.

    Args:
        recipient: A valid email address (e.g. john@example.com).
        subject: The email subject line.
        body: The email body text.
    """
    if not recipient or not subject or not body:
        return "Error: recipient, subject, and body are all required."
    return _send_email(recipient=recipient, subject=subject, body=body)


@tool
def query_documents(query: str, top_k: int = 5) -> str:
    """
    Search the user's personal document library for relevant information.
    Use this when the user asks about something in their documents, notes, or files.

    Args:
        query: The search query or question.
        top_k: Number of results to return (default 5).
    """
    results = _search_docs(query=query, top_k=top_k)
    if not results:
        return "No documents found. Upload files via the Connectors panel."

    lines = []
    for r in results:
        lines.append(
            f"[{r['filename']} | relevance: {r['score']}]\n{r['content']}"
        )
    return "\n\n---\n\n".join(lines)
