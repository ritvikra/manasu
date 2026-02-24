import type { Message } from "../types";

interface Props {
  message: Message;
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
    </svg>
  );
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  if (!isUser) {
    return (
      <div className="mb-8">
        <p className="text-[#1C1C1E] text-base leading-[1.75] whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-[1.1em] bg-[#9C9C9A] ml-0.5 animate-pulse align-middle" />
          )}
        </p>
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-4 text-[#9C9C9A]">
            <button
              className="p-1.5 rounded-md hover:bg-[#F0F0EE] hover:text-[#1C1C1E] transition-colors"
              aria-label="Share"
            >
              <ShareIcon />
            </button>
            <button
              className="p-1.5 rounded-md hover:bg-[#F0F0EE] hover:text-[#1C1C1E] transition-colors"
              aria-label="Copy"
              onClick={() => navigator.clipboard.writeText(message.content)}
            >
              <CopyIcon />
            </button>
            <button
              className="p-1.5 rounded-md hover:bg-[#F0F0EE] hover:text-[#1C1C1E] transition-colors"
              aria-label="Retry"
            >
              <RetryIcon />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-6">
      <div className="max-w-[72%] bg-[#EBEBEA] text-[#1C1C1E] rounded-2xl px-4 py-3 text-sm leading-relaxed">
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}
