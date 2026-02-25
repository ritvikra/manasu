# Manasu

A privacy-first Mac desktop AI assistant that reads and drafts iMessages and emails in your voice — entirely on-device, no cloud dependencies.

## What It Does

- Reads your recent iMessages via macOS Messages SQLite database
- Drafts context-aware replies using a locally-running LLM that mimics your communication style
- Sends iMessages via AppleScript automation
- Maintains a persistent chat history using ChromaDB for semantic search
- Runs a multi-agent LangGraph pipeline (Supervisor → Router → Drafter) to handle message classification, routing, and drafting

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Tauri 2.x (Rust) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Python FastAPI (sidecar, port 8000) |
| LLM | Ollama (llama3.2, local) |
| Agent Orchestration | LangGraph (StateGraph, Supervisor pattern) |
| Vector DB | ChromaDB (chat history, semantic search) |
| iMessage Read | SQLite (`~/Library/Messages/chat.db`) |
| iMessage Send | AppleScript via Python subprocess |

## Prerequisites

- macOS (Apple Silicon or Intel)
- [Ollama](https://ollama.com) installed and running
- Node.js 18+ and npm
- Python 3.12 (recommended — 3.13+ may lack wheels for chromadb/sentence-transformers)
- Rust toolchain (for Tauri desktop build only)

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/ritvikrallapalli/manasu.git
cd manasu
```

### 2. Pull the LLM model

```bash
ollama serve        # in a separate terminal
ollama pull llama3.2
```

### 3. Set up the backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Set up the frontend

```bash
cd frontend
npm install
```

## Running the App

### Backend

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Frontend (browser dev — fastest)

```bash
cd frontend
npm run dev
# opens http://localhost:1420
```

### Frontend (full Tauri desktop app)

```bash
cd frontend
npm run tauri dev
```

## macOS Permissions

Grant these in **System Settings → Privacy & Security**:

| Permission | Needed For |
|---|---|
| Full Disk Access → Terminal | Reading `~/Library/Messages/chat.db` |
| Automation → Terminal → Messages.app | Sending iMessages via AppleScript |

## Project Structure

```
manasu/
├── backend/
│   ├── main.py                  FastAPI app (SSE /chat, /history, /connectors/status)
│   ├── config.py                Model, paths, self-reply number
│   ├── agents/
│   │   ├── supervisor.py        LangGraph StateGraph builder
│   │   ├── router.py            Router node (llama3.2 + tools)
│   │   ├── drafters.py          Drafter node
│   │   └── tools.py             read_recent_imessages, send_imessage tools
│   ├── models/state.py          AgentState TypedDict
│   └── services/
│       ├── imessage_service.py  SQLite reader + AppleScript sender
│       ├── chroma_service.py    ChromaDB chat history
│       └── ollama_service.py    Health check
└── frontend/
    └── src/
        ├── App.tsx
        ├── components/          Sidebar, ChatArea, MessageBubble, InputArea,
        │                        ConnectorsModal, SettingsModal
        ├── hooks/               useChat.ts, useConnectors.ts
        ├── services/api.ts      Axios + SSE streaming
        └── types/index.ts
```

## Architecture

```
User Input
    │
    ▼
FastAPI /chat (SSE stream)
    │
    ▼
LangGraph Supervisor
    ├── Router Node (classifies intent)
    │       └── Tools: read_recent_imessages, send_imessage
    └── Drafter Node (generates reply in user's voice)
            └── ChromaDB (retrieves similar past messages for style context)
```

## Privacy

All processing happens locally on your machine. No data is sent to external servers. The LLM runs via Ollama on localhost, and all message data stays on-device.
