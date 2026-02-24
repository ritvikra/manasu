"""
Persistent settings store — saved to ~/.manasu/settings.json.
Resets LLM singletons whenever settings change so the next request
picks up the new values.
"""
import json
from pathlib import Path

_SETTINGS_FILE = Path.home() / ".manasu" / "settings.json"

DEFAULTS: dict = {
    "temperature": 0.1,
    "model": "llama3.2",
    "ollama_url": "http://localhost:11434",
}

_cache: dict = {}


def get_settings() -> dict:
    global _cache
    if _cache:
        return _cache
    if _SETTINGS_FILE.exists():
        try:
            stored = json.loads(_SETTINGS_FILE.read_text())
            _cache = {**DEFAULTS, **stored}
        except Exception:
            _cache = dict(DEFAULTS)
    else:
        _cache = dict(DEFAULTS)
    return _cache


def update_settings(data: dict) -> dict:
    global _cache
    current = get_settings()
    for key in DEFAULTS:
        if key in data:
            current[key] = data[key]
    _cache = current
    _SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    _SETTINGS_FILE.write_text(json.dumps(_cache, indent=2))
    _reset_llm_singletons()
    return _cache


def _reset_llm_singletons() -> None:
    """Force router and drafter to rebuild ChatOllama with new settings."""
    try:
        import agents.router as router
        router._llm_tools = None
        router._llm_plain = None
    except Exception:
        pass
    try:
        import agents.drafters as drafters
        drafters._llm = None
    except Exception:
        pass
