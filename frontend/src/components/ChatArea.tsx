import { useRef, useEffect, useState } from "react";
import type { Message, ChatSession } from "../types";
import { MessageBubble } from "./MessageBubble";
import { InputArea } from "./InputArea";

interface Props {
  session: ChatSession | null;
  messages: Message[];
  isLoading: boolean;
  statusText: string;
  onSend: (text: string) => void;
  onOpenConnectors: () => void;
  onOpenSettings: () => void;
}

export function ChatArea({
  session,
  messages,
  isLoading,
  statusText,
  onSend,
  onOpenConnectors,
  onOpenSettings,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-[#E5E5E3] px-6">
        <div className="flex items-center">
          {/* Answer tab — active */}
          <button className="flex items-center gap-1.5 px-1 py-3 mr-4 text-sm font-medium text-[#1C1C1E] border-b-2 border-[#1C1C1E] -mb-px">
            {/* Perplexity-style asterisk icon */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22v-2z"/>
            </svg>
            Answer
          </button>
        </div>

        {/* Right: more menu */}
        <div className="flex items-center gap-1">
          <button
            className="w-8 h-8 rounded-lg text-[#6B6B69] hover:text-[#1C1C1E]
              hover:bg-[#F0F0EE] transition-colors flex items-center justify-center"
            aria-label="More options"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto py-8">
        <div className="max-w-3xl mx-auto px-6">

          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center py-28">
              <div className="w-10 h-10 bg-[#1C1C1E] rounded-xl flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22v-2z"/>
                </svg>
              </div>
              <h3 className="text-[#1C1C1E] text-xl font-semibold mb-2">
                {session?.title ?? "How can I help?"}
              </h3>
              <p className="text-[#9C9C9A] text-sm max-w-xs leading-relaxed">
                Ask me to read or send iMessages, or just have a conversation.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {statusText && (
            <div className="flex items-center gap-2 text-[#9C9C9A] text-xs mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9C9C9A] animate-pulse" />
              {statusText}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <InputArea
        onSend={onSend}
        disabled={isLoading}
        value={inputValue}
        onChange={setInputValue}
      />
    </div>
  );
}
