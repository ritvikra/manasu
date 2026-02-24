import asyncio
import json
import uuid
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from agents.supervisor import get_graph
from services.settings_service import get_settings, update_settings
from services.chroma_service import (
    create_chat,
    save_message,
    get_chat_messages,
    list_sessions,
    delete_session,
    update_session_title,
)
from services.ollama_service import check_ollama_health
from services.imessage_service import is_imessage_available
from services.mail_service import is_mail_available
from services import document_service

app = FastAPI(title="Manasu Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    chat_id: str | None = None
    message: str


class NewChatRequest(BaseModel):
    title: str = "New Chat"


# ── Chat endpoint (SSE streaming) ──────────────────────────────────────────

async def stream_chat(chat_id: str, user_message: str) -> AsyncGenerator[str, None]:
    graph = get_graph()

    # Load history from ChromaDB
    history = get_chat_messages(chat_id)
    lc_messages = []
    for msg in history:
        if msg["role"] == "human":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))

    lc_messages.append(HumanMessage(content=user_message))
    save_message(chat_id, "human", user_message)

    state = {"messages": lc_messages, "chat_id": chat_id, "next": ""}

    full_response = ""
    tool_used = False

    try:
        async for event in graph.astream(state, stream_mode="values"):
            messages = event.get("messages", [])
            if not messages:
                continue

            last = messages[-1]

            # Tool call status
            if isinstance(last, AIMessage) and last.tool_calls:
                for tc in last.tool_calls:
                    status_msg = f"Using tool: {tc['name']}…"
                    yield f"data: {json.dumps({'type': 'status', 'content': status_msg})}\n\n"
                tool_used = True

            # Tool results
            elif isinstance(last, ToolMessage):
                yield f"data: {json.dumps({'type': 'status', 'content': 'Processing results…'})}\n\n"

            # Final AI response
            elif isinstance(last, AIMessage) and last.content and not last.tool_calls:
                content = last.content
                full_response = content
                # Stream token by token (word chunks for responsiveness)
                words = content.split(" ")
                for i, word in enumerate(words):
                    chunk = word + (" " if i < len(words) - 1 else "")
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
                    await asyncio.sleep(0.01)

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        return

    if full_response:
        save_message(chat_id, "assistant", full_response)
        # Auto-title the chat from first user message
        sessions = list_sessions()
        for s in sessions:
            if s["chat_id"] == chat_id and s["title"] == "New Chat":
                title = user_message[:40] + ("…" if len(user_message) > 40 else "")
                update_session_title(chat_id, title)
                break

    yield f"data: {json.dumps({'type': 'done', 'chat_id': chat_id})}\n\n"


@app.post("/chat")
async def chat(req: ChatRequest):
    # Create new session if needed
    if not req.chat_id:
        chat_id = create_chat()
    else:
        chat_id = req.chat_id

    return StreamingResponse(
        stream_chat(chat_id, req.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── WebSocket endpoint ─────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            chat_id = data.get("chat_id") or create_chat()
            message = data.get("message", "")

            async for chunk in stream_chat(chat_id, message):
                # Strip "data: " prefix for WS
                payload = chunk.strip()
                if payload.startswith("data: "):
                    payload = payload[6:]
                await websocket.send_text(payload)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"type": "error", "content": str(e)})


# ── History endpoints ──────────────────────────────────────────────────────

@app.get("/history")
async def get_history():
    return list_sessions()


@app.get("/history/{chat_id}/messages")
async def get_messages(chat_id: str):
    return get_chat_messages(chat_id)


@app.delete("/history/{chat_id}")
async def delete_history(chat_id: str):
    delete_session(chat_id)
    return {"status": "deleted", "chat_id": chat_id}


@app.post("/history")
async def new_chat(req: NewChatRequest):
    chat_id = create_chat(req.title)
    return {"chat_id": chat_id, "title": req.title}


# ── Connector status ───────────────────────────────────────────────────────

@app.get("/connectors/status")
async def connectors_status():
    ollama = await check_ollama_health()
    imessage = is_imessage_available()
    mail = is_mail_available()
    docs = document_service.list_documents()
    return {
        "ollama": ollama,
        "imessage": imessage,
        "mail": mail,
        "documents": {"indexed": len(docs), "available": True},
        "model": ollama.get("model", "llama3.2"),
    }


# ── Document endpoints ──────────────────────────────────────────────────────

import tempfile
import os

class FolderSyncRequest(BaseModel):
    folder_path: str


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "")[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    try:
        result = document_service.ingest_file(tmp_path)
        # Rename stored filepath to original name in metadata (already set via ingest_file)
        result["filename"] = file.filename
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        os.unlink(tmp_path)


@app.get("/documents")
async def get_documents():
    return document_service.list_documents()


@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    deleted = document_service.delete_document(doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted", "doc_id": doc_id}


@app.post("/documents/sync-folder")
async def sync_folder(req: FolderSyncRequest):
    try:
        return document_service.ingest_folder(req.folder_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Settings ───────────────────────────────────────────────────────────────

class SettingsRequest(BaseModel):
    temperature: float | None = None
    model: str | None = None
    ollama_url: str | None = None


@app.get("/settings")
async def get_settings_endpoint():
    return get_settings()


@app.post("/settings")
async def update_settings_endpoint(req: SettingsRequest):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    return update_settings(data)


# ── Health check ───────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}
