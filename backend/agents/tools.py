from langchain_core.tools import tool
from services.imessage_service import read_recent_messages, send_imessage as _send


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
