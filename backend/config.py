import os
from pathlib import Path

# Suppress ChromaDB telemetry errors
os.environ["ANONYMIZED_TELEMETRY"] = "False"

# iMessage
SELF_REPLY_NUMBER = "+14804941220"
IMESSAGE_DB_PATH = Path.home() / "Library" / "Messages" / "chat.db"
TEMP_DIR = Path.home() / ".manasu" / "temp"
TEMP_DB_PATH = TEMP_DIR / "chat.db"

# Ollama
OLLAMA_URL = "http://localhost:11434"
MODEL = "llama3.2"

# ChromaDB
CHROMA_DIR = Path.home() / ".manasu" / "chroma"

# Ensure dirs exist
TEMP_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)
