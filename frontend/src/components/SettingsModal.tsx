import { useState, useEffect, useRef } from "react";
import {
  fetchSettings,
  saveSettings,
  collectTrainingData,
  fetchDatasetPreview,
  fetchTrainingStatus,
  startTraining,
  registerModel,
} from "../services/api";
import type { DatasetPreview, TrainingStatus } from "../services/api";

interface Settings {
  temperature: number;
  model: string;
  ollama_url: string;
}

interface Props {
  onClose: () => void;
}

type Tab = "general" | "finetune";
type ModelType = "imessage" | "email";

const STATUS_LABEL: Record<string, string> = {
  idle: "Not trained",
  training: "Training…",
  done: "Ready",
  error: "Error",
};

const STATUS_COLOR: Record<string, string> = {
  idle: "#6b7280",
  training: "#f59e0b",
  done: "#22c55e",
  error: "#ef4444",
};

export function SettingsModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("general");

  // ── General tab state ──
  const [settings, setSettings] = useState<Settings>({
    temperature: 0.1,
    model: "llama3.2",
    ollama_url: "http://localhost:11434",
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Fine-tune tab state ──
  const [collecting, setCollecting] = useState(false);
  const [collectCounts, setCollectCounts] = useState<{ imessage: number; email: number } | null>(null);
  const [collectErrors, setCollectErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState<ModelType | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({ imessage: "idle", email: "idle" });
  const [trainingLogs, setTrainingLogs] = useState<{ imessage: string[]; email: string[] }>({ imessage: [], email: [] });
  const [registerLogs, setRegisterLogs] = useState<{ imessage: string[]; email: string[] }>({ imessage: [], email: [] });
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSettings()
      .then((s) => setSettings(s))
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  useEffect(() => {
    if (tab === "finetune") {
      fetchTrainingStatus().then(setTrainingStatus).catch(() => {});
      fetchDatasetPreview().then(setPreview).catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [trainingLogs, registerLogs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await saveSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // fail silently
    } finally {
      setSaving(false);
    }
  };

  const handleCollect = async () => {
    setCollecting(true);
    setCollectErrors({});
    try {
      const { counts, errors } = await collectTrainingData(6);
      setCollectCounts(counts);
      setCollectErrors(errors);
      const updated = await fetchDatasetPreview();
      setPreview(updated);
    } catch (e) {
      setCollectErrors({ general: String(e) });
    } finally {
      setCollecting(false);
    }
  };

  const handleTrain = (modelType: ModelType) => {
    setTrainingStatus((s) => ({ ...s, [modelType]: "training" }));
    setTrainingLogs((l) => ({ ...l, [modelType]: [] }));
    startTraining(
      modelType,
      500,
      (line) => setTrainingLogs((l) => ({ ...l, [modelType]: [...l[modelType], line] })),
      () => setTrainingStatus((s) => ({ ...s, [modelType]: "done" })),
    );
  };

  const handleRegister = (modelType: ModelType) => {
    setRegisterLogs((l) => ({ ...l, [modelType]: [] }));
    registerModel(
      modelType,
      (line) => setRegisterLogs((l) => ({ ...l, [modelType]: [...l[modelType], line] })),
      () => {},
    );
  };

  const counts = preview?.counts ?? collectCounts ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-[#1a1a1a] rounded-2xl border border-[#2d2d2d]
          w-full max-w-lg mx-4 shadow-xl flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2d2d2d] shrink-0">
          <h2 className="text-white text-base font-semibold">Settings</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2d2d2d] px-6 shrink-0">
          {(["general", "finetune"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 mr-4 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-white text-white"
                  : "border-transparent text-[#6b7280] hover:text-[#9ca3af]"
              }`}
            >
              {t === "general" ? "General" : "Fine-Tuning"}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* ── General Tab ── */}
          {tab === "general" && (
            loadingSettings ? (
              <div className="flex items-center justify-center py-10 text-[#9ca3af] text-sm">Loading…</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[#9ca3af] text-xs font-medium block mb-1.5">Ollama URL</label>
                  <input
                    type="text"
                    value={settings.ollama_url}
                    onChange={(e) => setSettings({ ...settings, ollama_url: e.target.value })}
                    className="w-full bg-[#2d2d2d] text-white text-sm rounded-xl px-3 py-2.5
                      border border-[#2d2d2d] focus:border-[#404040] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[#9ca3af] text-xs font-medium block mb-1.5">Model</label>
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                    className="w-full bg-[#2d2d2d] text-white text-sm rounded-xl px-3 py-2.5
                      border border-[#2d2d2d] focus:border-[#404040] outline-none transition-colors"
                  />
                  <p className="text-[#6b7280] text-xs mt-1">
                    Must be available in Ollama (e.g., llama3.2, my-imessage-style)
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[#9ca3af] text-xs font-medium">Response Temperature</label>
                    <span className="text-white text-xs font-mono bg-[#2d2d2d] px-2 py-0.5 rounded-md">
                      {settings.temperature.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.1}
                    value={settings.temperature}
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-[#525252]"
                  />
                  <div className="flex justify-between text-[#6b7280] text-xs mt-0.5">
                    <span>Precise (0.0)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ── Fine-Tuning Tab ── */}
          {tab === "finetune" && (
            <div className="space-y-5">
              {/* Step 1: Collect */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white text-sm font-medium">1 — Collect Training Data</h3>
                  <button
                    onClick={handleCollect}
                    disabled={collecting}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-white
                      hover:bg-[#404040] transition-colors disabled:opacity-50"
                  >
                    {collecting ? "Collecting…" : "Collect (last 6 months)"}
                  </button>
                </div>
                <p className="text-[#6b7280] text-xs mb-2">
                  Reads your sent iMessages and emails to build style training pairs.
                </p>
                {counts && (
                  <div className="flex gap-3">
                    {(["imessage", "email"] as ModelType[]).map((type) => (
                      <div key={type} className="flex-1 bg-[#2d2d2d] rounded-xl px-3 py-2.5 text-center">
                        <div className="text-white text-lg font-semibold">{counts[type]}</div>
                        <div className="text-[#9ca3af] text-xs capitalize">{type} pairs</div>
                      </div>
                    ))}
                  </div>
                )}
                {Object.entries(collectErrors).map(([k, v]) => (
                  <p key={k} className="text-[#ef4444] text-xs mt-1">{k}: {v}</p>
                ))}
              </section>

              {/* Step 2: Preview */}
              {preview && (preview.imessage.length > 0 || preview.email.length > 0) && (
                <section>
                  <h3 className="text-white text-sm font-medium mb-2">2 — Preview Samples</h3>
                  {(["imessage", "email"] as ModelType[]).map((type) => (
                    preview[type].length > 0 && (
                      <div key={type} className="mb-2">
                        <button
                          onClick={() => setPreviewOpen(previewOpen === type ? null : type)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                            bg-[#2d2d2d] text-[#9ca3af] text-xs hover:bg-[#404040] transition-colors"
                        >
                          <span className="capitalize">{type} samples ({preview[type].length})</span>
                          <span>{previewOpen === type ? "▲" : "▼"}</span>
                        </button>
                        {previewOpen === type && (
                          <div className="mt-1 space-y-1.5 max-h-40 overflow-y-auto">
                            {preview[type].map((s, i) => (
                              <div key={i} className="bg-[#111] rounded-lg px-3 py-2 text-xs">
                                <p className="text-[#6b7280] mb-0.5 truncate">Q: {s.instruction}</p>
                                <p className="text-[#d1d5db] truncate">A: {s.output}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </section>
              )}

              {/* Step 3: Train */}
              <section>
                <h3 className="text-white text-sm font-medium mb-2">3 — Train Style Models</h3>
                <p className="text-[#6b7280] text-xs mb-3">
                  Runs MLX LoRA fine-tuning locally (~10 min on M2 per model, 500 iterations).
                </p>
                <div className="space-y-3">
                  {(["imessage", "email"] as ModelType[]).map((type) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs capitalize font-medium">
                            my-{type}-style
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              color: STATUS_COLOR[trainingStatus[type]],
                              backgroundColor: STATUS_COLOR[trainingStatus[type]] + "22",
                            }}
                          >
                            {STATUS_LABEL[trainingStatus[type]]}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTrain(type)}
                          disabled={trainingStatus[type] === "training" || (counts?.[type] ?? 0) === 0}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-white
                            hover:bg-[#404040] transition-colors disabled:opacity-40"
                        >
                          {trainingStatus[type] === "training" ? "Training…" : "Train"}
                        </button>
                      </div>
                      {trainingLogs[type].length > 0 && (
                        <div className="bg-[#0d0d0d] rounded-lg p-2.5 max-h-32 overflow-y-auto font-mono text-[10px] text-[#9ca3af]">
                          {trainingLogs[type].map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                          <div ref={logsEndRef} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Step 4: Register */}
              <section>
                <h3 className="text-white text-sm font-medium mb-2">4 — Register with Ollama</h3>
                <p className="text-[#6b7280] text-xs mb-3">
                  Fuses the adapter, converts to GGUF, and registers the model so you can select it in General settings.
                </p>
                <div className="space-y-3">
                  {(["imessage", "email"] as ModelType[]).map((type) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[#9ca3af] text-xs capitalize">my-{type}-style</span>
                        <button
                          onClick={() => handleRegister(type)}
                          disabled={trainingStatus[type] !== "done"}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#2d2d2d] text-white
                            hover:bg-[#404040] transition-colors disabled:opacity-40"
                        >
                          Register
                        </button>
                      </div>
                      {registerLogs[type].length > 0 && (
                        <div className="bg-[#0d0d0d] rounded-lg p-2.5 max-h-32 overflow-y-auto font-mono text-[10px] text-[#9ca3af]">
                          {registerLogs[type].map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#2d2d2d] shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[#9ca3af] text-sm
              border border-[#2d2d2d] hover:bg-[#2d2d2d] transition-colors"
          >
            {tab === "finetune" ? "Close" : "Cancel"}
          </button>
          {tab === "general" && (
            <button
              onClick={handleSave}
              disabled={loadingSettings || saving}
              className="flex-1 py-2.5 rounded-xl bg-[#404040] text-white text-sm
                font-medium hover:bg-[#525252] transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saved ? "Saved!" : saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
