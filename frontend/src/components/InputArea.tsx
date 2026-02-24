import { useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function InputArea({ onSend, disabled, value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend(value.trim());
        onChange("");
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSendClick = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      onChange("");
    }
  };

  return (
    <div className="px-6 py-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div
          className="border border-[#E0E0DE] rounded-2xl bg-[#F7F7F5]
            focus-within:border-[#9C9C9A] transition-colors"
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask a follow-up…"
            rows={1}
            className="w-full resize-none bg-transparent text-[#1C1C1E]
              placeholder-[#9C9C9A] px-4 pt-4 pb-2 text-sm outline-none
              min-h-[52px] overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            {/* Left: attach button */}
            <button
              className="w-8 h-8 rounded-full border border-[#D0D0CE] flex items-center justify-center
                text-[#6B6B69] hover:bg-[#E5E5E3] hover:border-[#9C9C9A] transition-colors"
              aria-label="Attach"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>

            {/* Right: model label + mic + send */}
            <div className="flex items-center gap-2">
              <span className="text-[#6B6B69] text-xs px-2.5 py-1 bg-[#EBEBEA] rounded-lg font-medium">
                llama3.2
              </span>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full
                  text-[#9C9C9A] hover:bg-[#E5E5E3] hover:text-[#1C1C1E] transition-colors"
                aria-label="Voice input"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
              <button
                onClick={handleSendClick}
                disabled={disabled || !value.trim()}
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
    </div>
  );
}
