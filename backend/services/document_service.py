import uuid
from datetime import datetime
from pathlib import Path

from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from services.chroma_service import _get_client

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

_ef = SentenceTransformerEmbeddingFunction("all-MiniLM-L6-v2")
_collection = None


def _get_collection():
    global _collection
    if _collection is None:
        _collection = _get_client().get_or_create_collection(
            name="documents",
            embedding_function=_ef,
        )
    return _collection


def _extract_text(filepath: Path) -> str:
    suffix = filepath.suffix.lower()
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(filepath))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise ValueError(f"Failed to read PDF: {e}")
    elif suffix == ".docx":
        try:
            from docx import Document
            doc = Document(str(filepath))
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            raise ValueError(f"Failed to read DOCX: {e}")
    elif suffix in {".txt", ".md"}:
        return filepath.read_text(encoding="utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def _chunk_text(text: str) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return [c for c in chunks if c.strip()]


def ingest_file(filepath: str | Path) -> dict:
    """Load → extract text → chunk → embed → store. Returns {doc_id, filename, chunk_count}."""
    filepath = Path(filepath)
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    if filepath.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {filepath.suffix}")

    text = _extract_text(filepath)
    chunks = _chunk_text(text)
    if not chunks:
        raise ValueError("No text content found in file.")

    doc_id = str(uuid.uuid4())
    upload_date = datetime.utcnow().isoformat()
    collection = _get_collection()

    ids = [f"{doc_id}-chunk-{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "doc_id": doc_id,
            "filename": filepath.name,
            "filepath": str(filepath),
            "chunk_index": i,
            "upload_date": upload_date,
            "file_type": filepath.suffix.lower(),
        }
        for i in range(len(chunks))
    ]

    collection.add(ids=ids, documents=chunks, metadatas=metadatas)
    return {"doc_id": doc_id, "filename": filepath.name, "chunk_count": len(chunks)}


def ingest_folder(folder_path: str | Path) -> dict:
    """Recursively ingest all supported files. Returns {indexed, skipped, errors}."""
    folder = Path(folder_path).expanduser()
    if not folder.is_dir():
        raise ValueError(f"Not a directory: {folder}")

    indexed, skipped, errors = 0, 0, []
    for filepath in folder.rglob("*"):
        if not filepath.is_file():
            continue
        if filepath.suffix.lower() not in SUPPORTED_EXTENSIONS:
            skipped += 1
            continue
        try:
            ingest_file(filepath)
            indexed += 1
        except Exception as e:
            errors.append({"file": filepath.name, "error": str(e)})

    return {"indexed": indexed, "skipped": skipped, "errors": errors}


def search_documents(query: str, top_k: int = 5) -> list[dict]:
    """Semantic search. Returns [{content, filename, score}]."""
    collection = _get_collection()
    count = collection.count()
    if count == 0:
        return []

    results = collection.query(query_texts=[query], n_results=min(top_k, count))
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    output = []
    for doc, meta, dist in zip(docs, metas, distances):
        output.append({
            "content": doc,
            "filename": meta.get("filename", "unknown"),
            "score": round(1 - dist, 4),
        })
    return output


def list_documents() -> list[dict]:
    """Returns [{doc_id, filename, chunk_count, upload_date}]."""
    collection = _get_collection()
    if collection.count() == 0:
        return []

    all_results = collection.get(include=["metadatas"])
    metadatas = all_results.get("metadatas", [])

    seen: dict[str, dict] = {}
    for meta in metadatas:
        doc_id = meta.get("doc_id", "")
        if doc_id not in seen:
            seen[doc_id] = {
                "doc_id": doc_id,
                "filename": meta.get("filename", ""),
                "chunk_count": 0,
                "upload_date": meta.get("upload_date", ""),
            }
        seen[doc_id]["chunk_count"] += 1

    return sorted(seen.values(), key=lambda x: x["upload_date"], reverse=True)


def delete_document(doc_id: str) -> bool:
    """Delete all chunks for a document_id."""
    collection = _get_collection()
    results = collection.get(where={"doc_id": doc_id})
    ids = results.get("ids", [])
    if not ids:
        return False
    collection.delete(ids=ids)
    return True
