import { useRef, useEffect, useState, KeyboardEvent, ChangeEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

type Tag = "files" | "texts" | "emails";

const TAG_LABELS: Record<Tag, string> = {
  files: "Files",
  texts: "Texts",
  emails: "Emails",
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
    <div className="px-6 py-6 bg-[#0c0c0c] min-h-[33vh] flex flex-col justify-end">
      <div className="max-w-3xl mx-auto w-full">
        {/* Files, Emails, Texts buttons */}
        <div className="flex items-center gap-2 mb-4">
          {(["files", "texts", "emails"] as Tag[]).map((tag) => {
            const active = activeTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2.5 rounded-xl text-base font-medium border transition-all duration-150 ${
                  active
                    ? "bg-white/[0.1] text-white border-white/[0.2]"
                    : "bg-transparent text-[#7a7a7a] border-white/[0.08] hover:border-white/[0.15] hover:text-[#a8a8a8]"
                }`}
              >
                {TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>

        <div className="relative flex items-center gap-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-white/[0.12] focus-within:ring-1 focus-within:ring-white/[0.06] transition-all duration-200 min-h-[4rem] pl-10 pr-10 py-3">
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
                : "Ask a follow-up…"
            }
            rows={1}
            className="flex-1 resize-none bg-transparent text-white px-6
              placeholder-[#5a5a5a] text-lg outline-none
              min-h-[2rem] overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Send button - inset from right */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-shrink-0 w-10 h-10 mr-2 rounded-xl bg-white text-[#0c0c0c]
              flex items-center justify-center hover:bg-white/90
              transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            aria-label="Send"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
            </svg>
          </button>
        </div>

        {/* Model selector below input */}
        <div className="mt-3 flex items-center justify-center">
          <button className="flex items-center gap-1.5 text-[#5a5a5a] text-sm hover:text-[#8b8b8b] transition-colors">
            <span>llama3.2</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
