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
  onOpenConnectors?: () => void;
  onOpenSettings?: () => void;
}

export function ChatArea({
  session,
  messages,
  isLoading,
  statusText,
  onSend,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#0c0c0c]">
      {/* Clean header bar */}
      <div className="h-10 px-8 border-b border-white/[0.06]" />

      {/* Message list */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col min-h-0">
          {messages.length === 0 && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 w-full">
              <div className="w-20 h-20 bg-white/[0.06] rounded-2xl flex items-center justify-center mb-8 ring-1 ring-white/[0.06]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22v-2z" />
                </svg>
              </div>
              <h3 className="text-white text-4xl font-semibold mb-5 tracking-tight">
                {session?.title ?? "How can I help?"}
              </h3>
              <p className="text-[#8b8b8b] text-xl max-w-md leading-relaxed">
                Ask me to read or send iMessages, or just have a conversation.
              </p>
            </div>
          )}

          {messages.length > 0 && (
            <div className="max-w-3xl mx-auto px-8 w-full py-10 space-y-12">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {statusText && (
                <div className="flex items-center gap-2 text-[#7a7a7a] text-base mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                  {statusText}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
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
