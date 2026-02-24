import type { ChatSession } from "../types";

interface Props {
  sessions: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onOpenConnectors: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  sessions,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onOpenConnectors,
  onOpenSettings,
}: Props) {
  const navItems = [
    {
      label: "Threads",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
        </svg>
      ),
      onClick: undefined,
    },
    {
      label: "Connectors",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h10c1.65 0 3 1.35 3 3s-1.35 3-3 3zm0-5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      ),
      onClick: onOpenConnectors,
    },
    {
      label: "Settings",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      ),
      onClick: onOpenSettings,
    },
  ];

  return (
    <div className="flex flex-col h-full w-64 bg-[#F7F7F5] border-r border-[#E5E5E3]">
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="w-7 h-7 bg-[#1C1C1E] rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22v-2z"/>
          </svg>
        </div>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-md
            text-[#9C9C9A] hover:bg-[#E5E5E3] hover:text-[#1C1C1E] transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="5" width="18" height="2" rx="1"/>
            <rect x="3" y="11" width="18" height="2" rx="1"/>
            <rect x="3" y="17" width="18" height="2" rx="1"/>
          </svg>
        </button>
      </div>

      {/* New Thread */}
      <div className="px-3 mb-1">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
            text-[#1C1C1E] text-sm hover:bg-[#E5E5E3] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          New Thread
        </button>
      </div>

      {/* Nav items */}
      <div className="px-3 pb-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
              text-[#3C3C3A] text-sm hover:bg-[#E5E5E3] hover:text-[#1C1C1E] transition-colors"
          >
            <span className="text-[#6B6B69]">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-[#E5E5E3] my-1" />

      {/* Recent + chat list */}
      <div className="flex-1 overflow-y-auto py-1">
        {sessions.length > 0 && (
          <p className="px-5 pt-2 pb-1 text-[#9C9C9A] text-xs font-semibold uppercase tracking-wider">
            Recent
          </p>
        )}

        {sessions.length === 0 && (
          <p className="text-[#9C9C9A] text-xs text-center mt-10 px-4">
            No threads yet
          </p>
        )}

        {sessions.map((session) => {
          const isActive = session.chat_id === activeChatId;
          return (
            <div
              key={session.chat_id}
              onClick={() => onSelectChat(session.chat_id)}
              className={`group relative mx-2 flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5
                cursor-pointer transition-colors text-sm ${
                  isActive
                    ? "bg-[#E5E5E3] text-[#1C1C1E]"
                    : "text-[#3C3C3A] hover:bg-[#EBEBEA]"
                }`}
            >
              <span className="flex-1 truncate">{session.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(session.chat_id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity
                  w-5 h-5 flex-shrink-0 flex items-center justify-center
                  text-[#9C9C9A] hover:text-[#DC2626] rounded"
                aria-label="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* User profile */}
      <div className="px-3 py-3 border-t border-[#E5E5E3]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#E5E5E3] cursor-pointer transition-colors">
          <div className="w-7 h-7 bg-[#1C1C1E] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            M
          </div>
          <span className="text-[#1C1C1E] text-sm font-medium truncate flex-1">Manasu</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#9C9C9A">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
