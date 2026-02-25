import subprocess


def _run_script(script: str, timeout: int = 15) -> tuple[bool, str]:
    """Run an AppleScript and return (success, output_or_error)."""
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode == 0:
            return True, result.stdout.strip()
        else:
            return False, result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "AppleScript timed out"
    except Exception as e:
        return False, str(e)


def is_mail_available() -> bool:
    """Check if Mail.app is accessible via AppleScript."""
    script = '''
tell application "Mail"
    set c to count of accounts
    return c as string
end tell
'''
    ok, _ = _run_script(script, timeout=5)
    return ok


def read_recent_emails(mailbox: str = "Inbox", limit: int = 5, sender_filter: str = "") -> list[dict]:
    """
    Read recent emails from Mail.app via AppleScript.
    Returns list of {subject, sender, date, body, id}.
    """
    safe_mailbox = mailbox.replace('"', '\\"')
    safe_limit = max(1, min(limit, 50))
    filter_clause = ""
    if sender_filter:
        safe_filter = sender_filter.replace('"', '\\"').lower()
        filter_clause = f'if (sender of msg contains "{safe_filter}") then'

    script = f'''
tell application "Mail"
    set output to ""
    try
        set allMsgs to messages of inbox
        set msgCount to count of allMsgs
        if msgCount > {safe_limit} then set msgCount to {safe_limit}
        set msgs to items 1 thru msgCount of allMsgs
        repeat with msg in msgs
            {f'if (sender of msg contains "{sender_filter.replace(chr(34), chr(92)+chr(34)).lower()}") then' if sender_filter else ''}
            set msgId to message id of msg as string
            set msgSubject to subject of msg as string
            set msgSender to sender of msg as string
            set msgDate to date received of msg as string
            set msgBody to (content of msg) as string
            if (length of msgBody) > 500 then
                set msgBody to (text 1 thru 500 of msgBody) & "..."
            end if
            set output to output & "---EMAIL---" & return
            set output to output & "id:" & msgId & return
            set output to output & "subject:" & msgSubject & return
            set output to output & "sender:" & msgSender & return
            set output to output & "date:" & msgDate & return
            set output to output & "body:" & msgBody & return
            {f'end if' if sender_filter else ''}
        end repeat
    on error errMsg
        set output to "ERROR:" & errMsg
    end try
    return output
end tell
'''
    ok, raw = _run_script(script)
    if not ok:
        return [{"error": f"Mail.app error: {raw}. Grant Automation access to Terminal in System Settings."}]

    if raw.startswith("ERROR:"):
        return [{"error": raw[6:].strip()}]

    emails = []
    for block in raw.split("---EMAIL---"):
        block = block.strip()
        if not block:
            continue
        email: dict = {}
        for line in block.splitlines():
            if line.startswith("id:"):
                email["id"] = line[3:].strip()
            elif line.startswith("subject:"):
                email["subject"] = line[8:].strip()
            elif line.startswith("sender:"):
                email["sender"] = line[7:].strip()
            elif line.startswith("date:"):
                email["date"] = line[5:].strip()
            elif line.startswith("body:"):
                email["body"] = line[5:].strip()
        if email.get("subject"):
            emails.append(email)

    return emails


def send_email(recipient: str, subject: str, body: str) -> str:
    """Send an email via Mail.app using AppleScript. Returns 'sent' or error string."""
    safe_recipient = recipient.replace('"', '\\"').replace("\\", "\\\\")
    safe_subject = subject.replace('"', '\\"').replace("\\", "\\\\")
    safe_body = body.replace('"', '\\"').replace("\\", "\\\\")

    script = f'''
tell application "Mail"
    set newMessage to make new outgoing message with properties {{\\
        subject: "{safe_subject}", \\
        content: "{safe_body}", \\
        visible: false}}
    tell newMessage
        make new to recipient at end of to recipients with properties {{address: "{safe_recipient}"}}
    end tell
    send newMessage
end tell
'''
    ok, output = _run_script(script)
    if ok:
        return f"Email sent to {recipient}"
    return f"Failed to send email: {output}"
