import { useRef, useEffect, useState, KeyboardEvent, ChangeEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

type Tag = "files" | "texts" | "emails";

const TAG_LABELS: Record<Tag, string> = {
  files: "files",
  texts: "texts",
  emails: "emails",
};

export function InputArea({ onSend, disabled, value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeTags, setActiveTags] = useState<Set<Tag>>(new Set());

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const toggleTag = (tag: Tag) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const buildMessage = () => {
    const order: Tag[] = ["files", "texts", "emails"];
    const prefix = order
      .filter((t) => activeTags.has(t))
      .map((t) => `[${t}]`)
      .join("");
    return prefix ? `${prefix} ${value.trim()}` : value.trim();
  };

  const handleSend = () => {
    const msg = buildMessage();
    if (msg && !disabled) {
      onSend(msg);
      onChange("");
      setActiveTags(new Set());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const canSend = (value.trim() || activeTags.size > 0) && !disabled;

  return (
    <div className="px-6 py-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div
          className="border border-[#E0E0DE] rounded-2xl bg-[#F7F7F5]
            focus-within:border-[#9C9C9A] transition-colors"
        >
          {/* Tag pills row — only shown when at least one is active */}
          {activeTags.size > 0 && (
            <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 flex-wrap">
              {(["files", "texts", "emails"] as Tag[])
                .filter((t) => activeTags.has(t))
                .map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                      bg-[#0A1929] text-white text-xs font-mono font-medium"
                  >
                    [{TAG_LABELS[tag]}]
                    <button
                      onClick={() => toggleTag(tag)}
                      className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              activeTags.size > 0
                ? "Ask a question about the selected sources…"
                : "Message Manasu…"
            }
            rows={1}
            className="w-full resize-none bg-transparent text-[#1C1C1E]
              placeholder-[#9C9C9A] px-4 pt-4 pb-2 text-sm outline-none
              min-h-[52px] overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            {/* Left: connector tag toggles */}
            <div className="flex items-center gap-1.5">
              {(["files", "texts", "emails"] as Tag[]).map((tag) => {
                const active = activeTags.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium
                      border transition-colors
                      ${
                        active
                          ? "bg-[#0A1929] text-white border-[#0A1929]"
                          : "bg-transparent text-[#6B6B69] border-[#D0D0CE] hover:border-[#9C9C9A] hover:text-[#1C1C1E]"
                      }`}
                  >
                    [{TAG_LABELS[tag]}]
                  </button>
                );
              })}
            </div>

            {/* Right: send */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-8 h-8 rounded-full bg-[#1C1C1E] text-white
                flex items-center justify-center hover:bg-[#3C3C3A]
                transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
