import json
import uuid
from datetime import datetime
from typing import Optional
import chromadb
from chromadb.config import Settings
from config import CHROMA_DIR


_client: Optional[chromadb.PersistentClient] = None


def _get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def _get_sessions_collection():
    client = _get_client()
    return client.get_or_create_collection("chat_sessions")


def _get_messages_collection():
    client = _get_client()
    return client.get_or_create_collection("chat_messages")


def create_chat(title: str = "New Chat") -> str:
    """Create a new chat session, return chat_id."""
    chat_id = str(uuid.uuid4())
    col = _get_sessions_collection()
    col.add(
        ids=[chat_id],
        documents=[title],
        metadatas=[{
            "title": title,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "preview": "",
        }],
    )
    return chat_id


def save_message(chat_id: str, role: str, content: str) -> None:
    """Save a message to ChromaDB and update session preview."""
    msg_id = str(uuid.uuid4())
    msg_col = _get_messages_collection()
    msg_col.add(
        ids=[msg_id],
        documents=[content],
        metadatas=[{
            "chat_id": chat_id,
            "role": role,
            "timestamp": datetime.utcnow().isoformat(),
        }],
    )

    # Update session preview
    sess_col = _get_sessions_collection()
    try:
        result = sess_col.get(ids=[chat_id])
        if result["metadatas"]:
            meta = result["metadatas"][0]
            meta["preview"] = content[:100]
            meta["updated_at"] = datetime.utcnow().isoformat()
            sess_col.update(ids=[chat_id], metadatas=[meta])
    except Exception:
        pass


def get_chat_messages(chat_id: str) -> list[dict]:
    """Get all messages for a chat session, ordered by timestamp."""
    msg_col = _get_messages_collection()
    result = msg_col.get(where={"chat_id": chat_id})
    if not result["ids"]:
        return []

    messages = []
    for i, doc in enumerate(result["documents"]):
        meta = result["metadatas"][i]
        messages.append({
            "role": meta["role"],
            "content": doc,
            "timestamp": meta.get("timestamp", ""),
        })
    messages.sort(key=lambda x: x["timestamp"])
    return messages


def list_sessions() -> list[dict]:
    """List all chat sessions sorted by updated_at desc."""
    sess_col = _get_sessions_collection()
    result = sess_col.get()
    if not result["ids"]:
        return []

    sessions = []
    for i, chat_id in enumerate(result["ids"]):
        meta = result["metadatas"][i]
        sessions.append({
            "chat_id": chat_id,
            "title": meta.get("title", "Untitled"),
            "preview": meta.get("preview", ""),
            "timestamp": meta.get("updated_at", meta.get("created_at", "")),
        })
    sessions.sort(key=lambda x: x["timestamp"], reverse=True)
    return sessions


def delete_session(chat_id: str) -> None:
    """Delete a chat session and all its messages."""
    sess_col = _get_sessions_collection()
    msg_col = _get_messages_collection()

    try:
        sess_col.delete(ids=[chat_id])
    except Exception:
        pass

    try:
        msg_col.delete(where={"chat_id": chat_id})
    except Exception:
        pass


def update_session_title(chat_id: str, title: str) -> None:
    sess_col = _get_sessions_collection()
    try:
        result = sess_col.get(ids=[chat_id])
        if result["metadatas"]:
            meta = result["metadatas"][0]
            meta["title"] = title
            sess_col.update(ids=[chat_id], documents=[title], metadatas=[meta])
    except Exception:
        pass
