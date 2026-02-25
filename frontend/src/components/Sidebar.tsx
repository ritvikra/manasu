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

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
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
    { label: "History", icon: <HistoryIcon />, onClick: undefined },
    { label: "Connectors", icon: <DiscoverIcon />, onClick: onOpenConnectors },
    { label: "Settings", icon: <SettingsIcon />, onClick: onOpenSettings },
  ];

  return (
    <div className="flex flex-col h-full w-[400px] bg-[#0f0f0f] border-r border-white/[0.06] flex-shrink-0">
      {/* Logo + expand toggle */}
      <div className="flex items-center justify-between px-8 py-7">
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8b8b8b] hover:bg-white/[0.06] hover:text-white transition-all duration-150"
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="5" width="18" height="2" rx="1" />
            <rect x="3" y="11" width="18" height="2" rx="1" />
            <rect x="3" y="17" width="18" height="2" rx="1" />
          </svg>
        </button>
      </div>

      {/* New Thread */}
      <div className="px-8 mb-6">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl bg-white/[0.06] text-white text-lg font-medium hover:bg-white/[0.1] transition-all duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          New Thread
        </button>
      </div>

      {/* Nav items */}
      <div className="px-8 pb-6 space-y-4">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="group w-full flex items-center gap-3 px-5 py-4 rounded-xl text-[#c9c9c9] text-lg hover:bg-white/[0.06] hover:text-white transition-all duration-150"
          >
            <span className="text-[#9ca3af] group-hover:text-white transition-colors [&>svg]:stroke-current">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-8 border-t border-white/[0.06]" />

      {/* Recent + chat list */}
      <div className="flex-1 overflow-y-auto py-6 px-8">
        {sessions.length > 0 && (
          <p className="text-[#8b8b8b] text-lg font-semibold mb-5">
            Recent
          </p>
        )}

        {sessions.length === 0 && (
          <p className="text-[#6b7280] text-base text-center mt-12 px-4">
            No threads yet
          </p>
        )}

        {sessions.map((session) => {
          const isActive = session.chat_id === activeChatId;
          return (
            <div
              key={session.chat_id}
              onClick={() => onSelectChat(session.chat_id)}
              className={`group relative flex items-center gap-2 px-5 py-4 rounded-xl mb-3
                cursor-pointer transition-all duration-150 text-lg ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-[#a8a8a8] hover:bg-white/[0.04]"
                }`}
            >
              <span className="flex-1 min-w-0 truncate">{session.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(session.chat_id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity
                  w-5 h-5 flex-shrink-0 flex items-center justify-center
                  text-[#6b7280] hover:text-[#ef4444] rounded"
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
    </div>
  );
}
