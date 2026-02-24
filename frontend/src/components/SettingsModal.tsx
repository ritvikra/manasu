import { useState, useEffect } from "react";
import { fetchSettings, saveSettings } from "../services/api";

interface Settings {
  temperature: number;
  model: string;
  ollama_url: string;
}

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const [settings, setSettings] = useState<Settings>({
    temperature: 0.1,
    model: "llama3.2",
    ollama_url: "http://localhost:11434",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => setSettings(s))
      .catch(() => {/* keep defaults */})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await saveSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // fail silently — settings stay local
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-2xl border border-[#E4E4E7]
          w-full max-w-md mx-4 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#18181B] text-base font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-[#18181B] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-[#A1A1AA] text-sm">
            Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[#71717A] text-xs font-medium block mb-1.5">
                Ollama URL
              </label>
              <input
                type="text"
                value={settings.ollama_url}
                onChange={(e) => setSettings({ ...settings, ollama_url: e.target.value })}
                className="w-full bg-white text-[#18181B] text-sm rounded-xl px-3 py-2.5
                  border border-[#E4E4E7] focus:border-[#18181B] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-[#71717A] text-xs font-medium block mb-1.5">
                Model
              </label>
              <input
                type="text"
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full bg-white text-[#18181B] text-sm rounded-xl px-3 py-2.5
                  border border-[#E4E4E7] focus:border-[#18181B] outline-none transition-colors"
              />
              <p className="text-[#A1A1AA] text-xs mt-1">
                Must be available in Ollama (e.g., llama3.2, mistral)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#71717A] text-xs font-medium">
                  Response Temperature
                </label>
                <span className="text-[#18181B] text-xs font-mono bg-[#F4F4F5] px-2 py-0.5 rounded-md">
                  {settings.temperature.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={settings.temperature}
                onChange={(e) =>
                  setSettings({ ...settings, temperature: parseFloat(e.target.value) })
                }
                className="w-full accent-[#18181B]"
              />
              <div className="flex justify-between text-[#A1A1AA] text-xs mt-0.5">
                <span>Precise (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
              <p className="text-[#A1A1AA] text-xs mt-1">
                Applies to general responses. Tool routing always uses low temperature.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[#71717A] text-sm
              border border-[#E4E4E7] hover:bg-[#F4F4F5] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="flex-1 py-2.5 rounded-xl bg-[#18181B] text-white text-sm
              font-medium hover:bg-[#3F3F46] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved ? "Saved!" : saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
