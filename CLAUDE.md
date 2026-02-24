# Project: Manasu
**Architecture:** Tauri + React/Tailwind (Frontend) & Python FastAPI (Backend Sidecar).
**LLM Engine:** Local Ollama (base model: llama3.2).
**Orchestration:** LangGraph (Supervisor routing pattern).
**Design System Strict Rules:**
- ONLY Navy Blue (#0A1929, #132F4C) and White text.
- NO gradients, solid colors only.
- Font: Inter (Google Fonts, FK Grotesk substitute).
- Layout: fixed 400px left sidebar (chat history), flex-1 right main chat.

**Self-reply handle:** +14804941220
**Reference Document:** Always check `PRD.md` for tool logic, AppleScripts, and architecture before writing code.

---

## Project Structure
```
manasu/
├── CLAUDE.md / PRD.md
├── backend/            Python FastAPI sidecar
│   ├── main.py         Entry: FastAPI app (SSE /chat, WS /ws, /history, /connectors/status)
│   ├── config.py       SELF_REPLY_NUMBER, OLLAMA_URL, MODEL, paths
│   ├── requirements.txt
│   ├── agents/         LangGraph nodes
│   │   ├── supervisor.py   StateGraph builder
│   │   ├── router.py       Router node (llama3.2 + tools)
│   │   ├── drafters.py     Drafter node
│   │   └── tools.py        @tool: read_recent_imessages, send_imessage
│   ├── models/
│   │   └── state.py    AgentState TypedDict
│   └── services/
│       ├── imessage_service.py   SQLite reader + AppleScript sender
│       ├── chroma_service.py     ChromaDB chat history
│       └── ollama_service.py     Health check
└── frontend/           Tauri 2.x + React/TypeScript/Vite
    ├── src/
    │   ├── App.tsx
    │   ├── components/   Sidebar, ChatArea, MessageBubble, InputArea,
    │   │                 ConnectorsModal, SettingsModal
    │   ├── hooks/        useChat.ts, useConnectors.ts
    │   ├── services/     api.ts (Axios + SSE streaming)
    │   ├── types/        index.ts
    │   └── styles/       theme.ts
    └── src-tauri/        Tauri Rust shell (1200×800 window)
```

---

## Dev Commands

### Prerequisites (one-time)
```bash
# Install Python 3.12 if chromadb/sentence-transformers fail on 3.14
brew install python@3.12
python3.12 -m venv backend/.venv
source backend/.venv/bin/activate

# Start Ollama
ollama serve          # in a separate terminal
ollama pull llama3.2
```

### Backend
```bash
cd backend
python3 -m venv .venv          # if not already done
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (browser-only — fastest for dev)
```bash
cd frontend
npm install
npm run dev                    # opens http://localhost:1420
```

### Frontend (full Tauri desktop app)
```bash
cd frontend
npm run tauri dev
```

---

## macOS Permissions Required
- **Full Disk Access** → Terminal (or app binary) — for reading `~/Library/Messages/chat.db`
- **Automation** → Terminal → Messages.app — for sending iMessages via AppleScript

Grant in: System Settings → Privacy & Security → Full Disk Access / Automation
