import type { Message } from "../types";

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  if (!isUser) {
    return (
      <div>
        <div className="bg-white/[0.06] rounded-2xl px-12 py-4 border border-white/[0.04] min-h-[3rem] flex items-center">
          <p className="text-[#e8e8e8] text-lg leading-[1.75] whitespace-pre-wrap break-words w-full">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-[1.1em] bg-[#9ca3af] ml-0.5 animate-pulse align-middle" />
          )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[72%] bg-white/[0.1] text-white rounded-2xl px-12 py-4 text-lg leading-relaxed border border-white/[0.06] min-h-[3rem] flex items-center justify-end">
        <p className="whitespace-pre-wrap break-words w-full text-right">{message.content}</p>
      </div>
    </div>
  );
}
