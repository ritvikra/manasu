# Product Requirements Document: Mac Personal Assistant App

**Version:** 1.0  
**Date:** February 23, 2026  
**Author:** Ritvik Rallapalli  
**Status:** Final Specification

## Executive Summary

This document specifies the complete architecture, design, and implementation requirements for a privacy-first Mac desktop application that serves as an intelligent personal assistant. The application integrates with macOS Messages (iMessage) and Mail, provides Retrieval-Augmented Generation (RAG) capabilities for personal documents, and uses locally fine-tuned LLMs to mimic the user's communication style across different contexts (casual messaging vs. professional email).

The app is distributed as a downloadable `.dmg` file (not via the Mac App Store), requires users to have Ollama installed, and runs entirely on-device with no cloud dependencies.

## Table of Contents

\begin{itemize}
\item Executive Summary
\item Product Overview
\item Technical Architecture
\item Technology Stack
\item System Requirements
\item Core Features and Functionality
\item User Interface Design Specification
\item Database Architecture
\item LLM Integration and Fine-Tuning
\item Agent Workflow and Logic
\item Security and Privacy
\item Installation and Setup Flow
\item Development Roadmap
\item Success Metrics
\item Appendices
\end{itemize}

## Product Overview

### Vision

Create a sophisticated personal AI assistant that can read and respond to iMessages and emails, search through personal documents using semantic search, and generate responses that authentically match the user's voice—all while running entirely on the user's Mac with complete privacy.

### Target User

Technical users (developers, researchers, power users) who:
\begin{itemize}
\item Own Apple Silicon Macs (M1/M2/M3/M4)
\item Value privacy and want on-device AI processing
\item Already use iMessage and Apple Mail
\item Have Ollama installed or are comfortable installing it
\item Want to augment their productivity with context-aware AI
\end{itemize}

### Key Differentiators

\begin{itemize}
\item \textbf{Complete Privacy:} All data processing happens locally—no cloud API calls
\item \textbf{Context-Aware Fine-Tuning:} Separate models for casual iMessage vs. professional email tone
\item \textbf{True OS Integration:} Reads actual chat.db and Mail databases, sends real messages/emails
\item \textbf{Persistent Memory:} Chat history and documents stored in vector database for semantic retrieval
\item \textbf{Agentic Architecture:} Uses LangGraph supervisor pattern for complex multi-step workflows
\end{itemize}

## Technical Architecture

### High-Level Architecture Diagram

┌─────────────────────────────────────────────────────────┐
│                    Tauri Frontend                       │
│              (React + TypeScript)                       │
│         Navy Blue Theme, FK Grotesk Font                │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/WebSocket
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Python Backend (FastAPI)                   │
│                  (Tauri Sidecar)                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  LangGraph   │  │   ChromaDB   │  │  AppleScript │ │
│  │  Supervisor  │  │ Vector Store │  │   Executor   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │ Ollama API (localhost:11434)
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Ollama Service                         │
├─────────────────────────────────────────────────────────┤
│  Base Model:       llama3.2 (3B)                        │
│  iMessage Adapter: my-imessage-style.gguf               │
│  Email Adapter:    my-email-style.gguf                  │
└─────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│              macOS System Resources                     │
├─────────────────────────────────────────────────────────┤
│  ~/Library/Messages/chat.db                             │
│  ~/Library/Mail/                                        │
│  Apple Metal GPU (for inference acceleration)           │
└─────────────────────────────────────────────────────────┘

### Component Responsibilities

\begin{table}
\begin{tabular}{|l|p{10cm}|}
\hline
\textbf{Component} & \textbf{Responsibility} \\
\hline
Tauri Frontend & Renders UI, handles user input, displays chat history, manages WebSocket connection to backend \\
\hline
Python Backend & Orchestrates LLM calls, executes tools, manages vector database, runs AppleScripts \\
\hline
LangGraph Supervisor & Routes requests to appropriate agents, manages multi-step workflows, handles tool calling \\
\hline
ChromaDB & Stores chat history and document embeddings, provides semantic search \\
\hline
Ollama & Runs local LLMs (base + adapters) with Apple Metal GPU acceleration \\
\hline
AppleScript Executor & Sends iMessages and emails, reads Mail inbox \\
\hline
\end{tabular}
\end{table}

## Technology Stack

### Frontend

\begin{itemize}
\item \textbf{Framework:} Tauri 2.x (Rust + WebView)
\item \textbf{UI Library:} React 18+ with TypeScript
\item \textbf{Styling:} Tailwind CSS (custom navy blue theme)
\item \textbf{Font:} FK Grotesk (bundled with app)
\item \textbf{State Management:} React Context API + Zustand
\item \textbf{Communication:} Axios for HTTP, native WebSocket for streaming
\end{itemize}

### Backend

\begin{itemize}
\item \textbf{Language:} Python 3.11+
\item \textbf{Web Framework:} FastAPI 0.110+
\item \textbf{ASGI Server:} Uvicorn
\item \textbf{LLM Orchestration:} LangChain 0.2+, LangGraph 0.2+
\item \textbf{LLM Interface:} langchain-ollama, ChatOllama
\item \textbf{Vector Database:} ChromaDB 0.5+
\item \textbf{Embeddings:} sentence-transformers (all-MiniLM-L6-v2)
\item \textbf{Document Loaders:} LangChain document loaders (PDF, DOCX, TXT, Markdown)
\item \textbf{Database:} SQLite3 (built-in) for reading chat.db
\item \textbf{Packaging:} PyInstaller (compile to standalone executable)
\end{itemize}

### LLM Infrastructure

\begin{itemize}
\item \textbf{Inference Engine:} Ollama (must be pre-installed by user)
\item \textbf{Base Model:} Llama 3.2 3B Instruct (optimized for tool calling)
\item \textbf{Fine-Tuning Framework:} Apple MLX (mlx-lm)
\item \textbf{Adapter Format:} LoRA adapters converted to GGUF
\item \textbf{Conversion Tools:} llama.cpp conversion scripts
\end{itemize}

### System Scripting

\begin{itemize}
\item \textbf{iMessage Read/Write:} SQLite3 + osascript (AppleScript)
\item \textbf{Mail Read/Write:} osascript (AppleScript)
\item \textbf{Process Management:} Python subprocess module
\end{itemize}

## System Requirements

### Hardware Requirements

\begin{table}
\begin{tabular}{|l|l|}
\hline
\textbf{Component} & \textbf{Minimum Specification} \\
\hline
Processor & Apple Silicon (M1 or newer) \\
\hline
RAM & 16 GB (32 GB recommended) \\
\hline
Storage & 10 GB free space \\
\hline
GPU & Integrated Apple Metal GPU \\
\hline
\end{tabular}
\end{table}

### Software Requirements

\begin{table}
\begin{tabular}{|l|l|}
\hline
\textbf{Software} & \textbf{Version} \\
\hline
macOS & 13.0 Ventura or later \\
\hline
Ollama & Latest stable version \\
\hline
Messages.app & Active and configured \\
\hline
Mail.app & Active and configured \\
\hline
\end{tabular}
\end{table}

### Permissions Required

\begin{itemize}
\item \textbf{Full Disk Access:} Required to read \texttt{\textasciitilde/Library/Messages/chat.db}
\item \textbf{Automation Access:} Required to control Messages.app and Mail.app via AppleScript
\item \textbf{Network Access:} Required to communicate with local Ollama service (localhost only)
\end{itemize}

## Core Features and Functionality

### Feature 1: iMessage Integration

#### Read Messages
\begin{itemize}
\item \textbf{Capability:} Query recent messages from specific contacts or group chats
\item \textbf{Implementation:} Copy \texttt{chat.db} to temp directory, execute SQLite queries
\item \textbf{Data Returned:} Contact name, message text, timestamp, is\_from\_me flag
\end{itemize}

#### Send Messages
\begin{itemize}
\item \textbf{Capability:} Send iMessages to phone numbers or iMessage handles
\item \textbf{Implementation:} Execute AppleScript via Python subprocess
\item \textbf{Script Template:}
\end{itemize}

tell application "Messages"
    send "{message_text}" to buddy "{phone_or_email}"
end tell

#### Tool Definition
@tool
def read_recent_imessages(contact_name: str, limit: int = 10) -> str:
    """
    Read recent iMessage conversations from a specific contact.
    Args:
        contact_name: Name or phone number of contact
        limit: Number of recent messages to retrieve (default 10)
    Returns:
        Formatted string of recent messages with timestamps
    """

@tool
def send_imessage(recipient: str, message: str) -> str:
    """
    Send an iMessage to a recipient.
    Args:
        recipient: Phone number or email address
        message: Text message to send
    Returns:
        Confirmation message
    """

### Feature 2: Email Integration

#### Read Email
\begin{itemize}
\item \textbf{Capability:} Fetch emails from specific mailboxes (Inbox, Sent, specific folders)
\item \textbf{Implementation:} AppleScript queries to Mail.app
\item \textbf{Data Returned:} Subject, sender, recipient, body content, date
\end{itemize}

#### Send Email
\begin{itemize}
\item \textbf{Capability:} Compose and send emails with subject, body, and recipients
\item \textbf{Implementation:} AppleScript to create and send email via Mail.app
\item \textbf{Script Template:}
\end{itemize}

tell application "Mail"
    set newMessage to make new outgoing message with properties {
        subject: "{subject}",
        content: "{body}",
        visible: false
    }
    tell newMessage
        make new to recipient with properties {address: "{recipient}"}
        send
    end tell
end tell

#### Tool Definition
@tool
def read_recent_emails(mailbox: str = "Inbox", limit: int = 5) -> str:
    """
    Read recent emails from specified mailbox.
    Args:
        mailbox: Name of mailbox (default "Inbox")
        limit: Number of emails to retrieve
    Returns:
        Formatted list of emails with subject, sender, content
    """

@tool
def send_email(recipient: str, subject: str, body: str) -> str:
    """
    Send an email via Mail.app.
    Args:
        recipient: Email address of recipient
        subject: Email subject line
        body: Email body content
    Returns:
        Confirmation message
    """

### Feature 3: Document RAG System

#### File Ingestion
\begin{itemize}
\item \textbf{Supported Formats:} PDF, DOCX, TXT, MD, HTML
\item \textbf{Processing Pipeline:}
\begin{enumerate}
\item User uploads file via UI
\item LangChain document loader parses file
\item Text split into chunks (500 tokens, 50 token overlap)
\item Chunks embedded using sentence-transformers
\item Embeddings stored in ChromaDB with metadata
\end{enumerate}
\item \textbf{Metadata Stored:} Filename, file path, upload date, chunk index
\end{itemize}

#### Semantic Search
\begin{itemize}
\item \textbf{Query Processing:} User question embedded using same model
\item \textbf{Retrieval:} ChromaDB returns top-k most similar chunks (k=5 default)
\item \textbf{Context Assembly:} Retrieved chunks formatted as context for LLM
\end{itemize}

#### Tool Definition
@tool
def query_personal_knowledge(query: str, top_k: int = 5) -> str:
    """
    Search the user's document database for relevant information.
    Args:
        query: Natural language search query
        top_k: Number of relevant chunks to return
    Returns:
        Relevant text passages from user's documents
    """

### Feature 4: Chat History and Memory

#### Storage Strategy
\begin{itemize}
\item \textbf{Backend:} ChromaDB collection separate from documents
\item \textbf{Schema:} Each chat turn stored as document with metadata
\item \textbf{Metadata Fields:} chat\_id (UUID), timestamp, user\_message, assistant\_response, context\_used
\end{itemize}

#### Conversation Management
\begin{itemize}
\item \textbf{New Chat:} Generate new chat\_id, display in left sidebar
\item \textbf{Load Chat:} Query ChromaDB for all messages with matching chat\_id
\item \textbf{Delete Chat:} Remove all entries with matching chat\_id from ChromaDB
\item \textbf{Search Chats:} Semantic search across all historical conversations
\end{itemize}

### Feature 5: Fine-Tuning System

#### iMessage Style Training

**Data Collection:**
\begin{itemize}
\item Query \texttt{chat.db} for all messages where \texttt{is\_from\_me = 1}
\item Filter to messages sent in last 6 months (configurable)
\item Format as instruction-response pairs (previous message → user's reply)
\item Export to JSONL format
\end{itemize}

**Training Process:**
import subprocess

def train_imessage_adapter():
    subprocess.run([
        "python", "-m", "mlx_lm.lora",
        "--model", "mlx-community/Llama-3.2-3B-Instruct",
        "--train",
        "--data", "./datasets/imessage_style.jsonl",
        "--adapter-path", "./adapters/imessage",
        "--iters", "500",
        "--learning-rate", "1e-4"
    ])

**GGUF Conversion:**
def convert_adapter_to_gguf(adapter_path: str, output_name: str):
    subprocess.run([
        "python", "convert_lora_to_gguf.py",
        adapter_path,
        "--outfile", f"{output_name}.gguf"
    ])

**Ollama Model Creation:**
def create_ollama_model(model_name: str, adapter_file: str, system_prompt: str):
    modelfile = f"""
FROM llama3.2
ADAPTER ./{adapter_file}
SYSTEM {system_prompt}
"""
    with open("Modelfile", "w") as f:
        f.write(modelfile)
    
    subprocess.run(["ollama", "create", model_name, "-f", "Modelfile"])

#### Email Style Training

**Data Collection:**
\begin{itemize}
\item Use AppleScript to extract all sent emails from Mail.app
\item Filter to last 6 months
\item Format as instruction-response pairs (received email → user's reply)
\item Export to JSONL format
\end{itemize}

**Training Process:** Identical to iMessage adapter training, different dataset and output path

#### UI Flow
\begin{enumerate}
\item User clicks "Settings" → "Fine-Tune Models"
\item UI displays two cards: "iMessage Style" and "Email Style"
\item User clicks "Train iMessage Model"
\item Backend shows progress: "Collecting messages... (500 found)"
\item Progress: "Training adapter... (iteration 100/500)"
\item Progress: "Converting to GGUF..."
\item Progress: "Creating Ollama model..."
\item Success: "iMessage model ready! Model name: my-imessage-style"
\end{enumerate}

#### Content
Connectors
──────────────────────────────

iMessages
[●] Connected
Status: 152 conversations available
[Refresh Database]

Apple Mail  
[●] Connected
Status: 3 accounts, 847 emails indexed
[Refresh Index]

Document Library
Status: 24 documents, 487 chunks
[Upload Files] [Manage Documents]

[Close]

\begin{itemize}
\item \textbf{Section Headers:} Heading 2 typography
\item \textbf{Status Indicators:} Green dot if connected, red if error
\item \textbf{Action Buttons:} Secondary style (outlined), Accent Blue border and text
\end{itemize}

### Settings Modal

#### Trigger
Clicking "Settings" button in top-right header

#### Tabs
\begin{itemize}
\item General
\item Fine-Tuning
\item Privacy
\item About
\end{itemize}

#### General Tab
\begin{itemize}
\item \textbf{Ollama URL:} Text input, default "http://localhost:11434"
\item \textbf{Base Model:} Dropdown, default "llama3.2"
\item \textbf{Temperature:} Slider, 0.0 to 1.0, default 0.7
\item \textbf{Max Tokens:} Number input, default 2048
\end{itemize}

#### Fine-Tuning Tab

**iMessage Model Card:**
┌─────────────────────────────────────────┐
│ iMessage Writing Style                  │
│                                         │
│ Status: [Not Trained] or [Ready]        │
│ Last Trained: Never or [Date]           │
│                                         │
│ [Train Model]                           │
│                                         │
│ Training will analyze your sent         │
│ messages and create a personalized      │
│ writing style adapter.                  │
└─────────────────────────────────────────┘

**Email Model Card:** (same structure)

**Training Progress UI:**
When training active, replace button with progress bar and status text
Training iMessage Model...
[▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░] 60%
Iteration 300/500

#### Privacy Tab
\begin{itemize}
\item \textbf{Data Location:} Display path to \texttt{\textasciitilde/.mac\_assistant/}
\item \textbf{Clear Chat History:} Button with confirmation dialog
\item \textbf{Delete All Documents:} Button with confirmation dialog
\item \textbf{Permissions Status:} Display Full Disk Access and Automation status
\end{itemize}

#### About Tab
\begin{itemize}
\item App version
\item Credits and licenses
\item Link to documentation
\end{itemize}

## Database Architecture

### ChromaDB Collections

#### Collection 1: `chat_history`
**Purpose:** Store all conversation turns for chat history feature

**Schema:**
\begin{table}
\begin{tabular}{|l|l|l|}
\hline
\textbf{Field} & \textbf{Type} & \textbf{Description} \\
\hline
id & string (UUID) & Unique identifier for message \\
\hline
chat\_id & string (UUID) & Groups messages into conversations \\
\hline
role & string & "user" or "assistant" \\
\hline
content & string & Message text \\
\hline
timestamp & string (ISO 8601) & When message was created \\
\hline
context\_used & list[string] & IDs of documents used in RAG \\
\hline
tool\_calls & list[dict] & Record of tools executed \\
\hline
\end{tabular}
\end{table}

**Embedding:** Each message embedded for semantic search across history

#### Collection 2: `documents`
**Purpose:** Store user-uploaded documents for RAG

**Schema:**
\begin{table}
\begin{tabular}{|l|l|l|}
\hline
\textbf{Field} & \textbf{Type} & \textbf{Description} \\
\hline
id & string (UUID) & Unique identifier for chunk \\
\hline
document\_id & string (UUID) & Groups chunks from same file \\
\hline
content & string & Text chunk (500 tokens) \\
\hline
filename & string & Original file name \\
\hline
filepath & string & Original file path \\
\hline
upload\_date & string (ISO 8601) & When file was uploaded \\
\hline
chunk\_index & int & Position in original document \\
\hline
file\_type & string & Extension (pdf, docx, txt, md) \\
\hline
\end{tabular}
\end{table}

**Embedding:** sentence-transformers/all-MiniLM-L6-v2

### File System Storage

**Base Directory:** `~/.mac_assistant/`

**Structure:**
~/.mac_assistant/
├── chroma_db/              # ChromaDB persistent storage
│   ├── chat_history/
│   └── documents/
├── adapters/               # LoRA adapter files
│   ├── imessage/
│   │   └── adapters.safetensors
│   └── email/
│       └── adapters.safetensors
├── models/                 # GGUF converted adapters
│   ├── imessage_adapter.gguf
│   └── email_adapter.gguf
├── datasets/               # Training data JSONL files
│   ├── imessage_style.jsonl
│   └── email_style.jsonl
├── temp/                   # Temporary chat.db copies
└── logs/                   # Application logs

## LLM Integration and Fine-Tuning

### Ollama Models

#### Base Model: `llama3.2`
\begin{itemize}
\item \textbf{Purpose:} Main reasoning and tool-calling engine
\item \textbf{Parameters:} 3 billion
\item \textbf{Quantization:} Q4\_K\_M (optimal speed/quality balance)
\item \textbf{Context Window:} 4096 tokens
\item \textbf{Temperature:} 0.0 (deterministic for tool calls)
\item \textbf{Use Cases:} Router/supervisor, tool selection, context gathering
\end{itemize}

#### Adapter Model: `my-imessage-style`
\begin{itemize}
\item \textbf{Purpose:} Generate iMessage responses in user's casual style
\item \textbf{Base:} llama3.2
\item \textbf{Adapter:} imessage\_adapter.gguf (LoRA, ~50MB)
\item \textbf{Temperature:} 0.7 (creative for natural conversation)
\item \textbf{System Prompt:} "You are a casual messaging assistant. Write exactly like the user writes iMessages: use their vocabulary, emoji patterns, abbreviations, and tone."
\end{itemize}

#### Adapter Model: `my-email-style`
\begin{itemize}
\item \textbf{Purpose:} Generate email responses in user's professional style
\item \textbf{Base:} llama3.2
\item \textbf{Adapter:} email\_adapter.gguf (LoRA, ~50MB)
\item \textbf{Temperature:} 0.5 (balanced creativity and consistency)
\item \textbf{System Prompt:} "You are a professional email assistant. Write exactly like the user writes emails: match their greeting style, formality level, closing phrases, and communication patterns."
\end{itemize}

### LangChain Tool Definitions

#### Complete Tool Suite

from langchain_core.tools import tool
import subprocess
import sqlite3
import shutil
from datetime import datetime

@tool
def read_recent_imessages(contact_name: str, limit: int = 10) -> str:
    """
    Read recent iMessage conversations from a specific contact.
    
    Args:
        contact_name: Name, phone number, or email of contact
        limit: Number of recent messages to retrieve (default 10)
    
    Returns:
        Formatted string of recent messages with timestamps and sender
    """
    # Copy chat.db to temp to avoid lock
    db_path = "~/Library/Messages/chat.db"
    temp_db = "~/.mac_assistant/temp/chat.db"
    shutil.copy2(db_path, temp_db)
    
    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    
    query = """
    SELECT 
        message.text,
        message.is_from_me,
        datetime(message.date/1000000000 + 978307200, 'unixepoch', 'localtime') as date
    FROM message
    JOIN chat_message_join ON message.ROWID = chat_message_join.message_id
    JOIN chat ON chat_message_join.chat_id = chat.ROWID
    JOIN handle ON chat.ROWID = handle.ROWID
    WHERE handle.id LIKE ?
    ORDER BY message.date DESC
    LIMIT ?
    """
    
    cursor.execute(query, (f"%{contact_name}%", limit))
    results = cursor.fetchall()
    conn.close()
    
    formatted = []
    for text, is_from_me, date in results:
        sender = "You" if is_from_me else contact_name
        formatted.append(f"[{date}] {sender}: {text}")
    
    return "\n".join(formatted)

@tool
def send_imessage(recipient: str, message: str) -> str:
    """
    Send an iMessage to a recipient via Messages.app.
    
    Args:
        recipient: Phone number or iMessage email address
        message: Text message to send
    
    Returns:
        Confirmation message
    """
    script = f'''
    tell application "Messages"
        send "{message}" to buddy "{recipient}"
    end tell
    '''
    
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        return f"Message sent to {recipient}"
    else:
        return f"Error sending message: {result.stderr}"

@tool
def read_recent_emails(mailbox: str = "Inbox", limit: int = 5) -> str:
    """
    Read recent emails from specified mailbox in Mail.app.
    
    Args:
        mailbox: Name of mailbox (default "Inbox")
        limit: Number of emails to retrieve (default 5)
    
    Returns:
        Formatted list of emails with subject, sender, date, and content
    """
    script = f'''
    tell application "Mail"
        set emailList to messages 1 thru {limit} of mailbox "{mailbox}"
        set output to ""
        repeat with eachEmail in emailList
            set output to output & "Subject: " & (subject of eachEmail) & "\\n"
            set output to output & "From: " & (sender of eachEmail) & "\\n"
            set output to output & "Date: " & (date received of eachEmail) & "\\n"
            set output to output & "Content: " & (content of eachEmail) & "\\n"
            set output to output & "---\\n"
        end repeat
        return output
    end tell
    '''
    
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True,
        text=True
    )
    
    return result.stdout if result.returncode == 0 else f"Error: {result.stderr}"

@tool
def send_email(recipient: str, subject: str, body: str) -> str:
    """
    Send an email via Mail.app.
    
    Args:
        recipient: Email address of recipient
        subject: Email subject line
        body: Email body content
    
    Returns:
        Confirmation message
    """
    script = f'''
    tell application "Mail"
        set newMessage to make new outgoing message with properties {{subject:"{subject}", content:"{body}", visible:false}}
        tell newMessage
            make new to recipient with properties {{address:"{recipient}"}}
            send
        end tell
    end tell
    '''
    
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True,
        text=True
    )
    
    return f"Email sent to {recipient}" if result.returncode == 0 else f"Error: {result.stderr}"

@tool
def query_personal_knowledge(query: str, top_k: int = 5) -> str:
    """
    Search the user's personal document database for relevant information.
    Uses semantic search to find passages related to the query.
    
    Args:
        query: Natural language search query
        top_k: Number of relevant chunks to return (default 5)
    
    Returns:
        Relevant text passages from user's documents with sources
    """
    # ChromaDB query
    collection = chroma_client.get_collection("documents")
    results = collection.query(
        query_texts=[query],
        n_results=top_k
    )
    
    formatted = []
    for doc, metadata in zip(results['documents'][0], results['metadatas'][0]):
        source = metadata['filename']
        formatted.append(f"[Source: {source}]\n{doc}\n")
    
    return "\n".join(formatted)

# Tool list for binding to LLM
tools = [
    read_recent_imessages,
    send_imessage,
    read_recent_emails,
    send_email,
    query_personal_knowledge
]

## Agent Workflow and Logic

### LangGraph Supervisor Architecture

#### State Definition
from typing import TypedDict, List
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: List[BaseMessage]
    next_step: str
    context: str
    draft_type: str  # "imessage" or "email"

#### Node Definitions

**Node 1: Router (Base Model)**
from langchain_ollama import ChatOllama

router_llm = ChatOllama(
    model="llama3.2",
    temperature=0,
    base_url="http://localhost:11434"
)

router_with_tools = router_llm.bind_tools(tools)

def router_node(state: AgentState):
    """
    Analyzes user request and executes necessary tools.
    Determines if task requires iMessage or email drafter.
    """
    messages = state["messages"]
    response = router_with_tools.invoke(messages)
    
    # If tool calls present, execute them
    if response.tool_calls:
        # Execute tools and gather context
        context = execute_tool_calls(response.tool_calls)
        
        # Determine draft type based on tool calls
        draft_type = None
        for tool_call in response.tool_calls:
            if "imessage" in tool_call.name.lower():
                draft_type = "imessage"
            elif "email" in tool_call.name.lower():
                draft_type = "email"
        
        return {
            "messages": messages + [response],
            "context": context,
            "draft_type": draft_type,
            "next_step": "draft" if draft_type else "respond"
        }
    
    # No tools needed, direct response
    return {
        "messages": messages + [response],
        "next_step": "end"
    }

**Node 2: iMessage Drafter**
imessage_llm = ChatOllama(
    model="my-imessage-style",
    temperature=0.7,
    base_url="http://localhost:11434"
)

def imessage_drafter_node(state: AgentState):
    """
    Generates iMessage response using fine-tuned casual style.
    """
    context = state.get("context", "")
    user_request = state["messages"][-1].content
    
    prompt = f"""Based on this context:
{context}

User wants to: {user_request}

Draft a casual iMessage response in your natural style."""
    
    response = imessage_llm.invoke(prompt)
    
    return {
        "messages": state["messages"] + [response],
        "next_step": "end"
    }

**Node 3: Email Drafter**
email_llm = ChatOllama(
    model="my-email-style",
    temperature=0.5,
    base_url="http://localhost:11434"
)

def email_drafter_node(state: AgentState):
    """
    Generates email response using fine-tuned professional style.
    """
    context = state.get("context", "")
    user_request = state["messages"][-1].content
    
    prompt = f"""Based on this email context:
{context}

User wants to: {user_request}

Draft a professional email response in your natural style."""
    
    response = email_llm.invoke(prompt)
    
    return {
        "messages": state["messages"] + [response],
        "next_step": "end"
    }

#### Workflow Construction
from langgraph.graph import StateGraph, END

workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("router", router_node)
workflow.add_node("imessage_drafter", imessage_drafter_node)
workflow.add_node("email_drafter", email_drafter_node)

# Define edges
workflow.set_entry_point("router")

def should_draft(state: AgentState) -> str:
    """Route to appropriate drafter or end."""
    next_step = state.get("next_step")
    draft_type = state.get("draft_type")
    
    if next_step == "draft" and draft_type == "imessage":
        return "imessage_drafter"
    elif next_step == "draft" and draft_type == "email":
        return "email_drafter"
    else:
        return END

workflow.add_conditional_edges(
    "router",
    should_draft,
    {
        "imessage_drafter": "imessage_drafter",
        "email_drafter": "email_drafter",
        END: END
    }
)

workflow.add_edge("imessage_drafter", END)
workflow.add_edge("email_drafter", END)

# Compile
app = workflow.compile()

### Example Execution Flows

#### Flow 1: Simple Question (No Tools)
**User:** "What is machine learning?"

**Execution:**
\begin{enumerate}
\item Router analyzes: No tools needed
\item Router generates direct response
\item END
\end{enumerate}

**Output:** Educational response about machine learning

#### Flow 2: Read and Reply to iMessage
**User:** "Check if John texted me and reply that I'll be there"

**Execution:**
\begin{enumerate}
\item Router analyzes: Needs read\_recent\_imessages tool
\item Router executes: read\_recent\_imessages("John")
\item Context gathered: "John: Hey, are you coming to the meeting?"
\item Router determines: draft\_type = "imessage"
\item Route to imessage\_drafter
\item iMessage Drafter generates: "Yeah I'll be there! See you soon"
\item END
\end{enumerate}

**Output:** Draft iMessage shown in UI with [Send] button

#### Flow 3: Email with Document Context
**User:** "Reply to Sarah's email about the project, use my notes on project timeline"

**Execution:**
\begin{enumerate}
\item Router analyzes: Needs read\_recent\_emails and query\_personal\_knowledge
\item Router executes: read\_recent\_emails()
\item Context: "Sarah: Can you confirm the project timeline?"
\item Router executes: query\_personal\_knowledge("project timeline")
\item Context: "Project phases: Q1 - Design, Q2 - Development, Q3 - Testing"
\item Router determines: draft\_type = "email"
\item Route to email\_drafter
\item Email Drafter generates: Professional email with timeline details
\item END
\end{enumerate}

**Output:** Draft email shown in UI with [Send] button

### Streaming Status Updates

During workflow execution, backend should emit status messages to frontend via WebSocket:

async def stream_status(status: str):
    await websocket.send_json({
        "type": "status",
        "content": status
    })

# In workflow nodes:
await stream_status("Reading messages from John...")
await stream_status("Searching your documents...")
await stream_status("Drafting response in your style...")

Frontend displays these as temporary status messages in chat area.

## Security and Privacy

### Data Storage

\begin{itemize}
\item \textbf{All Local:} No data leaves the user's Mac
\item \textbf{No Analytics:} App does not phone home or collect telemetry
\item \textbf{No Cloud Dependencies:} Ollama runs locally, no API keys required
\item \textbf{Encrypted Storage:} macOS FileVault encrypts all app data at rest
\end{itemize}

### Permissions Handling

#### Full Disk Access
\begin{itemize}
\item \textbf{Required For:} Reading \texttt{chat.db} from \texttt{\textasciitilde/Library/Messages/}
\item \textbf{Detection:} App attempts to read \texttt{chat.db} on first run
\item \textbf{Failure Flow:} If permission denied, show modal with instructions:
\end{itemize}

**Modal Content:**
Permission Required: Full Disk Access

To read your iMessages, Mac Assistant needs Full Disk 
Access permission.

How to grant access:
1. Open System Settings
2. Go to Privacy & Security > Full Disk Access
3. Click the + button
4. Navigate to Applications and select Mac Assistant
5. Toggle the switch ON
6. Restart Mac Assistant

[Open System Settings] [I'll Do This Later]

#### Automation Access
\begin{itemize}
\item \textbf{Required For:} Controlling Messages.app and Mail.app via AppleScript
\item \textbf{Detection:} macOS shows system dialog automatically on first script execution
\item \textbf{User Action:} Click "OK" on system dialog
\end{itemize}

### Code Signing and Notarization

For distribution outside Mac App Store:

\begin{enumerate}
\item Sign app with Developer ID certificate
\item Notarize with Apple: \texttt{xcrun notarytool submit}
\item Staple notarization ticket: \texttt{xcrun stapler staple}
\item Package as DMG with drag-to-Applications interface
\end{enumerate}

This prevents Gatekeeper from blocking the app.

## Installation and Setup Flow

### Prerequisites Check

When user first launches app:

\begin{enumerate}
\item Check if Ollama is installed and running
\item If not found, show:
\end{enumerate}

**Modal Content:**
Ollama Not Detected

Mac Assistant requires Ollama to run local AI models.

[Download Ollama] (opens https://ollama.com)
[I Already Have Ollama] (prompts to start service)
[Quit]

### Initial Setup Wizard

**Step 1: Welcome**
Welcome to Mac Assistant

Your private, on-device AI assistant for iMessages, 
emails, and documents.

[Get Started]

**Step 2: Permissions**
Grant Required Permissions

○ Full Disk Access (for reading iMessages)
○ Automation Access (for sending messages/emails)

[Grant Permissions]

**Step 3: Download Base Model**
Downloading AI Model

Downloading llama3.2 (3B parameters)...

[▓▓▓▓▓▓▓▓▓▓░░░░░░░░] 55%
1.8 GB / 3.2 GB

This only happens once. The model is stored locally
and never shared.

**Step 4: Complete**
Setup Complete!

You're ready to start using Mac Assistant.

Optional: Train personalized models to match your
writing style in Settings > Fine-Tuning.

[Start Chatting]

### First Run Experience

\begin{itemize}
\item Empty chat history sidebar shows "No chats yet" placeholder
\item Main chat area shows welcome message from assistant:
\end{itemize}

**Welcome Message:**
Hi! I'm your Mac Assistant. I can help you with:

• Reading and sending iMessages
• Managing your emails
• Searching through your documents
• Answering questions using your personal knowledge base

Try asking me something like:
- "Check my recent messages from Mom"
- "Draft a reply to John's email about the meeting"
- "What's in my notes about project deadlines?"

## Development Roadmap

### Phase 1: MVP (Weeks 1-4)

\begin{itemize}
\item Basic Tauri app with React frontend
\item Python FastAPI backend as Sidecar
\item Navy blue UI with FK Grotesk font
\item Chat interface with message bubbles
\item Ollama integration with base llama3.2 model
\item Tool implementations: read\_recent\_imessages, send\_imessage
\item Simple LangGraph workflow (no fine-tuned models yet)
\item ChromaDB integration for chat history storage
\item Working left sidebar with chat list
\end{itemize}

### Phase 2: Email + RAG (Weeks 5-6)

\begin{itemize}
\item Email tool implementations: read\_recent\_emails, send\_email
\item Document upload UI in Connectors modal
\item Document ingestion pipeline (PDF, DOCX, TXT support)
\item ChromaDB documents collection
\item query\_personal\_knowledge tool
\item RAG context integration in LangGraph workflow
\end{itemize}

### Phase 3: Fine-Tuning (Weeks 7-9)

\begin{itemize}
\item Settings modal with Fine-Tuning tab
\item Data collection scripts for iMessage and Email
\item MLX integration for LoRA training
\item GGUF conversion pipeline
\item Ollama model creation via Modelfile
\item LangGraph supervisor/agent routing pattern
\item Fine-tuned model integration (my-imessage-style, my-email-style)
\item Training progress UI with streaming updates
\end{itemize}

### Phase 4: Polish and Distribution (Weeks 10-12)

\begin{itemize}
\item Error handling and edge cases
\item Permissions detection and instruction modals
\item Setup wizard flow
\item Code signing and notarization
\item DMG packaging with drag-to-install
\item Documentation and README
\item Beta testing with target users
\item Performance optimization
\end{itemize}

## Success Metrics

### Technical Metrics

\begin{table}
\begin{tabular}{|l|l|}
\hline
\textbf{Metric} & \textbf{Target} \\
\hline
App Launch Time & < 3 seconds \\
\hline
First Message Response Time & < 4 seconds \\
\hline
Tool Execution Time & < 2 seconds per tool \\
\hline
Model Switching Overhead & < 1 second \\
\hline
Memory Usage (Idle) & < 500 MB \\
\hline
Memory Usage (Active) & < 4 GB \\
\hline
Fine-Tuning Time (500 iters) & < 10 minutes on M2 \\
\hline
\end{tabular}
\end{table}

### User Experience Metrics

\begin{itemize}
\item \textbf{Setup Success Rate:} > 90\% complete setup wizard without support
\item \textbf{Permission Grant Rate:} > 80\% grant both required permissions
\item \textbf{Tool Accuracy:} > 95\% successful tool executions without errors
\item \textbf{Fine-Tuning Adoption:} > 50\% of users train at least one model
\item \textbf{Daily Active Usage:} > 10 messages sent per day by active users
\end{itemize}

## Appendices

### Appendix A: Python Backend File Structure

backend/
├── main.py                    # FastAPI app entry point
├── requirements.txt           # Python dependencies
├── config.py                  # Configuration management
├── agents/
│   ├── __init__.py
│   ├── supervisor.py          # LangGraph workflow definition
│   ├── router.py              # Router node logic
│   ├── drafters.py            # iMessage and Email drafter nodes
│   └── tools.py               # Tool definitions
├── services/
│   ├── __init__.py
│   ├── ollama_service.py      # Ollama API client
│   ├── chroma_service.py      # ChromaDB operations
│   ├── imessage_service.py    # iMessage read/write
│   ├── mail_service.py        # Email read/write
│   └── document_service.py    # Document ingestion
├── training/
│   ├── __init__.py
│   ├── data_collector.py      # Extract training data
│   ├── mlx_trainer.py         # MLX fine-tuning
│   └── gguf_converter.py      # Adapter conversion
├── models/
│   └── state.py               # AgentState TypedDict
└── utils/
    ├── __init__.py
    ├── permissions.py         # Permission checking
    └── logging.py             # Logging configuration

### Appendix B: Frontend File Structure

frontend/
├── src/
│   ├── App.tsx                # Main app component
│   ├── index.tsx              # Entry point
│   ├── index.css              # Global styles (Tailwind)
│   ├── components/
│   │   ├── Sidebar.tsx        # Left chat history sidebar
│   │   ├── ChatArea.tsx       # Right message display area
│   │   ├── MessageBubble.tsx  # User/assistant message
│   │   ├── InputArea.tsx      # Bottom text input
│   │   ├── ConnectorsModal.tsx
│   │   ├── SettingsModal.tsx
│   │   └── SetupWizard.tsx
│   ├── hooks/
│   │   ├── useChat.ts         # Chat state management
│   │   ├── useWebSocket.ts    # Backend WS connection
│   │   └── useOllama.ts       # Ollama status checking
│   ├── services/
│   │   └── api.ts             # Backend HTTP client
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── styles/
│       └── theme.ts           # Color palette constants
├── public/
│   └── fonts/
│       ├── FKGroteskNeue-Regular.woff2
│       └── FKGroteskNeue-Bold.woff2
├── package.json
├── tailwind.config.js         # Navy blue theme config
└── tsconfig.json

### Appendix C: Tailwind Config for Navy Theme

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          primary: '#0A1929',
          secondary: '#132F4C',
          border: '#1E4976',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B2BAC2',
        },
        accent: {
          blue: '#3399FF',
          green: '#00C853',
          red: '#FF5252',
        },
      },
      fontFamily: {
        sans: ['FK Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

### Appendix D: Requirements.txt

fastapi==0.110.0
uvicorn==0.27.0
langchain==0.2.0
langchain-ollama==0.2.0
langgraph==0.2.0
chromadb==0.5.0
sentence-transformers==2.5.0
PyInstaller==6.3.0
python-multipart==0.0.9
websockets==12.0

### Appendix E: Installation Commands

**Installing MLX for Fine-Tuning:**
pip install mlx mlx-lm

**Installing llama.cpp for Conversion:**
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

**Building the App:**
# Frontend
cd frontend
npm install
npm run build

# Backend
cd backend
pip install -r requirements.txt
pyinstaller --onefile --add-data "models:models" main.py

# Tauri
cd ..
npm run tauri build

### Appendix F: Example Training Dataset Format

**iMessage Style JSONL:**
{"messages": [{"role": "user", "content": "Previous message from friend"}, {"role": "assistant", "content": "User's actual reply from chat.db"}]}
{"messages": [{"role": "user", "content": "Another message"}, {"role": "assistant", "content": "Another reply"}]}

**Email Style JSONL:**
{"messages": [{"role": "user", "content": "Email received by user"}, {"role": "assistant", "content": "User's sent reply"}]}

### Appendix G: Debugging Checklist

\begin{itemize}
\item \textbf{Ollama Not Responding:} Check \texttt{http://localhost:11434} in browser, verify service running
\item \textbf{Chat.db Access Denied:} Verify Full Disk Access granted in System Settings
\item \textbf{AppleScript Fails:} Check Automation permissions for Terminal/VSCode (during dev) or App (in production)
\item \textbf{Fine-Tuning Crashes:} Ensure 16GB+ RAM available, close other heavy apps
\item \textbf{Slow Inference:} Check Ollama using Metal GPU: \texttt{ollama ps} should show GPU memory usage
\item \textbf{Model Not Found:} Run \texttt{ollama list} to verify model installed, run \texttt{ollama pull llama3.2} if missing
\end{itemize}

## Conclusion

This PRD provides complete specifications for building a privacy-first Mac personal assistant that integrates deeply with macOS messaging and email systems, uses local LLMs for on-device processing, and learns the user's communication style through fine-tuning.

The architecture is designed for:
\begin{itemize}
\item \textbf{Privacy:} All processing on-device, no cloud dependencies
\item \textbf{Performance:} Optimized for Apple Silicon with Metal GPU acceleration
\item \textbf{Usability:} Clean, minimal navy blue interface with clear workflows
\item \textbf{Extensibility:} Modular tool system allows adding new capabilities
\item \textbf{Intelligence:} LangGraph supervisor pattern enables complex multi-step reasoning
\end{itemize}

Development should follow the phased roadmap, prioritizing core functionality (messages, chat UI, basic LLM) before advanced features (fine-tuning, RAG). Testing on real Apple Silicon hardware throughout development is critical to ensure performance targets are met.