"""
MLX LoRA fine-tuning wrapper for Apple Silicon.
Streams training output line by line via a callback.

Requires: pip install mlx-lm
"""

import subprocess
import sys
import threading
from pathlib import Path
from typing import Callable

from config import ADAPTERS_DIR, DATASETS_DIR

# Base model on HuggingFace Hub (mlx-community quantized version of llama3.2)
BASE_MODEL = "mlx-community/Llama-3.2-3B-Instruct-4bit"

# Training state per model_type
_training_state: dict[str, str] = {}  # "idle" | "training" | "done" | "error"
_training_lock = threading.Lock()


def get_status(model_type: str) -> str:
    adapter_path = ADAPTERS_DIR / model_type
    with _training_lock:
        state = _training_state.get(model_type)
    if state in ("training", "error"):
        return state
    if (adapter_path / "adapters.safetensors").exists() or (adapter_path / "adapter_config.json").exists():
        return "done"
    return "idle"


def train(
    model_type: str,
    on_progress: Callable[[str], None],
    iters: int = 500,
    learning_rate: float = 1e-4,
    batch_size: int = 4,
) -> None:
    """
    Run MLX LoRA fine-tuning synchronously. Call from a background thread.
    model_type: "imessage" | "email"
    on_progress: called with each log line from the training process.
    """
    dataset_path = DATASETS_DIR / f"{model_type}_style.jsonl"
    adapter_path = ADAPTERS_DIR / model_type

    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {dataset_path}. Run data collection first."
        )

    adapter_path.mkdir(parents=True, exist_ok=True)

    with _training_lock:
        _training_state[model_type] = "training"

    cmd = [
        sys.executable, "-m", "mlx_lm.lora",
        "--model", BASE_MODEL,
        "--train",
        "--data", str(dataset_path),
        "--adapter-path", str(adapter_path),
        "--iters", str(iters),
        "--learning-rate", str(learning_rate),
        "--batch-size", str(batch_size),
        "--val-batches", "0",  # skip validation split (small dataset)
    ]

    on_progress(f"[manasu] Starting MLX LoRA training for: {model_type}")
    on_progress(f"[manasu] Command: {' '.join(cmd)}")

    try:
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
            with _training_lock:
                _training_state[model_type] = "error"
            on_progress(f"[manasu] Training failed (exit code {process.returncode})")
            raise RuntimeError(f"mlx_lm.lora exited with code {process.returncode}")

        with _training_lock:
            _training_state[model_type] = "done"
        on_progress(f"[manasu] Training complete. Adapter saved to: {adapter_path}")

    except Exception as e:
        with _training_lock:
            _training_state[model_type] = "error"
        on_progress(f"[manasu] Error: {e}")
        raise
