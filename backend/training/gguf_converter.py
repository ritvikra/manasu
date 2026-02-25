"""
Convert MLX LoRA adapter → GGUF → register with Ollama.

Flow:
  1. mlx_lm.fuse  — merge adapter weights into base model
  2. mlx_lm.convert --to gguf  — export to GGUF format
  3. Write Ollama Modelfile
  4. ollama create <model-name>
"""

import subprocess
import sys
from pathlib import Path
from typing import Callable

from config import ADAPTERS_DIR
from training.mlx_trainer import BASE_MODEL

_SYSTEM_PROMPTS = {
    "imessage": (
        "Write exactly like the user's casual iMessages. "
        "Match their tone, length, punctuation style, and phrasing. "
        "Keep replies conversational and natural."
    ),
    "email": (
        "Write exactly like the user's professional emails. "
        "Match their tone, structure, sign-off style, and level of formality."
    ),
}

_MODEL_NAMES = {
    "imessage": "my-imessage-style",
    "email": "my-email-style",
}


def _run(cmd: list[str], on_progress: Callable[[str], None]) -> None:
    on_progress(f"[manasu] Running: {' '.join(cmd)}")
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    assert process.stdout is not None
    for line in process.stdout:
        on_progress(line.rstrip())
    process.wait()
    if process.returncode != 0:
        raise RuntimeError(f"Command failed (exit {process.returncode}): {' '.join(cmd)}")


def register(model_type: str, on_progress: Callable[[str], None]) -> str:
    """
    Fuse adapter, convert to GGUF, and register with Ollama.
    Returns the Ollama model name on success.
    """
    adapter_path = ADAPTERS_DIR / model_type
    fused_path = ADAPTERS_DIR / f"{model_type}_fused"
    gguf_path = ADAPTERS_DIR / f"{model_type}.gguf"
    modelfile_path = ADAPTERS_DIR / f"{model_type}.Modelfile"
    ollama_name = _MODEL_NAMES[model_type]
    system_prompt = _SYSTEM_PROMPTS[model_type]

    # 1. Fuse adapter into base model
    on_progress(f"[manasu] Step 1/4: Fusing adapter into base model...")
    fused_path.mkdir(parents=True, exist_ok=True)
    _run([
        sys.executable, "-m", "mlx_lm.fuse",
        "--model", BASE_MODEL,
        "--adapter-path", str(adapter_path),
        "--save-path", str(fused_path),
    ], on_progress)

    # 2. Convert fused model to GGUF (Q4_K_M quantization for Ollama)
    on_progress(f"[manasu] Step 2/4: Converting to GGUF...")
    _run([
        sys.executable, "-m", "mlx_lm.convert",
        "--hf-path", str(fused_path),
        "--mlx-path", str(gguf_path.with_suffix("")),  # temp dir
        "--dtype", "float16",
    ], on_progress)

    # Find the actual GGUF file (mlx_lm.convert may place it differently)
    # Fallback: try direct path
    candidate = gguf_path.with_suffix("") / "model.gguf"
    if candidate.exists():
        gguf_path = candidate
    elif not gguf_path.exists():
        # List what was generated
        parent = gguf_path.parent
        files = list(parent.glob("**/*.gguf"))
        if files:
            gguf_path = files[0]
            on_progress(f"[manasu] Found GGUF at: {gguf_path}")
        else:
            raise FileNotFoundError(
                f"No GGUF file found after conversion. "
                f"Check {parent} manually and create the Modelfile yourself."
            )

    # 3. Write Modelfile
    on_progress(f"[manasu] Step 3/4: Writing Modelfile...")
    modelfile_content = (
        f'FROM {gguf_path}\n'
        f'SYSTEM "{system_prompt}"\n'
        f'PARAMETER temperature 0.7\n'
    )
    modelfile_path.write_text(modelfile_content, encoding="utf-8")
    on_progress(f"[manasu] Modelfile written to: {modelfile_path}")

    # 4. Register with Ollama
    on_progress(f"[manasu] Step 4/4: Registering '{ollama_name}' with Ollama...")
    _run(["ollama", "create", ollama_name, "-f", str(modelfile_path)], on_progress)

    on_progress(f"[manasu] Done! Model '{ollama_name}' is ready in Ollama.")
    on_progress(f"[manasu] Switch to it in Settings > Model to use your personal style.")
    return ollama_name


def get_modelfile_template(model_type: str) -> str:
    """Return a Modelfile template string for manual use if automation fails."""
    gguf_path = ADAPTERS_DIR / f"{model_type}.gguf"
    system_prompt = _SYSTEM_PROMPTS.get(model_type, "")
    ollama_name = _MODEL_NAMES.get(model_type, f"my-{model_type}-style")
    return (
        f"# Save this as {ollama_name}.Modelfile and run:\n"
        f"# ollama create {ollama_name} -f {ollama_name}.Modelfile\n\n"
        f"FROM {gguf_path}\n"
        f'SYSTEM "{system_prompt}"\n'
        f"PARAMETER temperature 0.7\n"
    )
