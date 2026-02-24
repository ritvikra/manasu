import shutil
import sqlite3
import subprocess
from pathlib import Path
from config import IMESSAGE_DB_PATH, TEMP_DB_PATH, SELF_REPLY_NUMBER


def _copy_db() -> Path:
    """Copy chat.db to temp dir to avoid lock issues."""
    shutil.copy2(IMESSAGE_DB_PATH, TEMP_DB_PATH)
    return TEMP_DB_PATH


def is_imessage_available() -> bool:
    try:
        _copy_db()
        conn = sqlite3.connect(TEMP_DB_PATH)
        conn.execute("SELECT 1 FROM message LIMIT 1")
        conn.close()
        return True
    except Exception:
        return False


def read_recent_messages(contact_filter: str = "", limit: int = 10) -> list[dict]:
    """
    Read recent iMessages from chat.db.
    contact_filter: phone number or name substring to filter by (empty = all).
    Returns list of {sender, text, timestamp, is_from_me}.
    """
    try:
        db = _copy_db()
    except Exception as e:
        return [{"error": f"Cannot access chat.db: {e}. Grant Full Disk Access to Terminal."}]

    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row

    # Build query — join message + handle for sender info
    query = """
        SELECT
            m.text,
            m.is_from_me,
            m.date,
            COALESCE(h.id, 'Unknown') AS sender_id,
            COALESCE(c.display_name, h.id, 'Unknown') AS chat_name
        FROM message m
        LEFT JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
        LEFT JOIN chat c ON c.ROWID = cmj.chat_id
        LEFT JOIN handle h ON h.ROWID = m.handle_id
        WHERE m.text IS NOT NULL AND m.text != ''
    """
    params = []
    if contact_filter:
        query += " AND (h.id LIKE ? OR c.display_name LIKE ?)"
        like = f"%{contact_filter}%"
        params.extend([like, like])

    query += " ORDER BY m.date DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()

    results = []
    for row in rows:
        # macOS stores date as seconds since 2001-01-01 (Cocoa epoch)
        cocoa_epoch_offset = 978307200
        ts = int(row["date"] / 1_000_000_000) + cocoa_epoch_offset if row["date"] else 0
        results.append({
            "sender": "Me" if row["is_from_me"] else row["sender_id"],
            "text": row["text"],
            "timestamp": ts,
            "chat_name": row["chat_name"],
            "is_from_me": bool(row["is_from_me"]),
        })
    return results


def send_imessage(recipient: str, message: str) -> str:
    """Send an iMessage via AppleScript."""
    # Sanitize to prevent injection
    safe_message = message.replace('"', '\\"').replace("\\", "\\\\")
    safe_recipient = recipient.replace('"', '\\"')

    script = f'''
tell application "Messages"
    set targetService to 1st service whose service type = iMessage
    set targetBuddy to buddy "{safe_recipient}" of targetService
    send "{safe_message}" to targetBuddy
end tell
'''
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode == 0:
            return f"Message sent to {recipient}"
        else:
            return f"Failed to send: {result.stderr.strip()}"
    except subprocess.TimeoutExpired:
        return "Send timed out"
    except Exception as e:
        return f"Error sending message: {e}"
