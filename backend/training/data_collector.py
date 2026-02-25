"""
Collect training data from iMessages and Mail.app for LoRA fine-tuning.
Produces JSONL files of instruction-response pairs using only sent messages.
"""

import json
import shutil
import sqlite3
import subprocess
import time
from datetime import datetime, timedelta
from pathlib import Path

from config import IMESSAGE_DB_PATH, TEMP_DB_PATH, DATASETS_DIR


# ── iMessages ──────────────────────────────────────────────────────────────

def collect_imessage_data(months: int = 6) -> int:
    """
    Extract conversation pairs from chat.db where the user sent a reply.
    Returns the number of training samples written to imessage_style.jsonl.
    """
    try:
        shutil.copy2(IMESSAGE_DB_PATH, TEMP_DB_PATH)
    except Exception as e:
        raise RuntimeError(f"Cannot copy chat.db: {e}. Grant Full Disk Access to Terminal.")

    cutoff_unix = time.time() - (months * 30 * 24 * 3600)
    # macOS Cocoa epoch offset (seconds since 2001-01-01)
    cocoa_offset = 978307200
    cutoff_cocoa = (cutoff_unix - cocoa_offset) * 1_000_000_000  # nanoseconds

    conn = sqlite3.connect(TEMP_DB_PATH)
    conn.row_factory = sqlite3.Row

    # Fetch all messages in chronological order per chat, within the time window
    rows = conn.execute("""
        SELECT
            m.ROWID        AS msg_id,
            m.text,
            m.is_from_me,
            m.date,
            cmj.chat_id
        FROM message m
        JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
        WHERE m.text IS NOT NULL
          AND m.text != ''
          AND m.date > ?
        ORDER BY cmj.chat_id, m.date ASC
    """, (cutoff_cocoa,)).fetchall()
    conn.close()

    # Group by chat_id → build (received, sent) pairs
    chats: dict[int, list] = {}
    for row in rows:
        chats.setdefault(row["chat_id"], []).append(row)

    samples = []
    for msgs in chats.values():
        for i, msg in enumerate(msgs):
            if not msg["is_from_me"]:
                continue
            # Find the immediately preceding received message in the same chat
            prev = None
            for j in range(i - 1, -1, -1):
                if not msgs[j]["is_from_me"]:
                    prev = msgs[j]
                    break
            if prev is None:
                continue
            their_text = (prev["text"] or "").strip()
            my_text = (msg["text"] or "").strip()
            if len(their_text) < 3 or len(my_text) < 3:
                continue
            samples.append({
                "instruction": f"Reply to this iMessage: \"{their_text}\"",
                "output": my_text,
            })

    out_path = DATASETS_DIR / "imessage_style.jsonl"
    with open(out_path, "w", encoding="utf-8") as f:
        for s in samples:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")

    return len(samples)


# ── Emails ─────────────────────────────────────────────────────────────────

def collect_email_data(months: int = 6) -> int:
    """
    Extract sent emails from Mail.app via AppleScript.
    Searches all accounts for mailboxes named Sent/Sent Mail/Sent Messages.
    Returns the number of training samples written to email_style.jsonl.
    """
    safe_limit = months * 30  # rough upper bound on email count

    script = f"""
tell application "Mail"
    set output to ""
    set collected to 0
    try
        set allAccounts to every account
        repeat with acct in allAccounts
            try
                set allBoxes to every mailbox of acct
                repeat with mb in allBoxes
                    set mbName to name of mb as string
                    if mbName is "Sent" or mbName is "Sent Mail" or mbName is "Sent Messages" or mbName is "[Gmail]/Sent Mail" then
                        set allMsgs to messages of mb
                        set msgCount to count of allMsgs
                        if msgCount > {safe_limit} then set msgCount to {safe_limit}
                        if msgCount > 0 then
                            set msgs to items 1 thru msgCount of allMsgs
                            repeat with msg in msgs
                                if collected >= {safe_limit} then exit repeat
                                try
                                    set msgSubject to subject of msg as string
                                    set msgBody to (content of msg) as string
                                    if (length of msgBody) > 2000 then
                                        set msgBody to (text 1 thru 2000 of msgBody)
                                    end if
                                    if (length of msgSubject) > 1 and (length of msgBody) > 10 then
                                        set output to output & "---EMAIL---" & return
                                        set output to output & "subject:" & msgSubject & return
                                        set output to output & "body:" & msgBody & return
                                        set collected to collected + 1
                                    end if
                                end try
                            end repeat
                        end if
                        exit repeat
                    end if
                end repeat
            end try
        end repeat
    on error errMsg
        set output to "ERROR:" & errMsg
    end try
    return output
end tell
"""
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=120,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError("Mail.app AppleScript timed out")

    if result.returncode != 0:
        raise RuntimeError(f"Mail.app error: {result.stderr.strip()}")

    raw = result.stdout.strip()
    if raw.startswith("ERROR:"):
        raise RuntimeError(raw[6:].strip())

    samples = []
    for block in raw.split("---EMAIL---"):
        block = block.strip()
        if not block:
            continue
        subject = ""
        body_lines = []
        in_body = False
        for line in block.splitlines():
            if line.startswith("subject:") and not in_body:
                subject = line[8:].strip()
            elif line.startswith("body:"):
                in_body = True
                body_lines.append(line[5:].strip())
            elif in_body:
                body_lines.append(line)

        body = "\n".join(body_lines).strip()
        if len(subject) < 2 or len(body) < 10:
            continue

        samples.append({
            "instruction": f"Write an email with subject: \"{subject}\"",
            "output": body,
        })

    out_path = DATASETS_DIR / "email_style.jsonl"
    with open(out_path, "w", encoding="utf-8") as f:
        for s in samples:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")

    return len(samples)


# ── Preview ────────────────────────────────────────────────────────────────

def preview_dataset(model_type: str, n: int = 5) -> list[dict]:
    """Return first n samples from a JSONL dataset."""
    path = DATASETS_DIR / f"{model_type}_style.jsonl"
    if not path.exists():
        return []
    samples = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            samples.append(json.loads(line))
            if len(samples) >= n:
                break
    return samples


def dataset_count(model_type: str) -> int:
    """Count lines in a JSONL dataset file."""
    path = DATASETS_DIR / f"{model_type}_style.jsonl"
    if not path.exists():
        return 0
    with open(path, encoding="utf-8") as f:
        return sum(1 for line in f if line.strip())
