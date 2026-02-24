import httpx
from config import OLLAMA_URL, MODEL


async def check_ollama_health() -> dict:
    """Check if Ollama is running and the required model is available."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            if resp.status_code != 200:
                return {"running": False, "model_available": False, "model": MODEL}

            tags = resp.json().get("models", [])
            model_names = [m.get("name", "").split(":")[0] for m in tags]
            model_available = MODEL in model_names or any(
                m.startswith(MODEL) for m in model_names
            )
            return {
                "running": True,
                "model_available": model_available,
                "model": MODEL,
                "available_models": model_names,
            }
    except Exception:
        return {"running": False, "model_available": False, "model": MODEL}
