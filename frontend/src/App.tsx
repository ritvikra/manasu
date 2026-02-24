import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { ConnectorsModal } from "./components/ConnectorsModal";
import { SettingsModal } from "./components/SettingsModal";
import { useChat } from "./hooks/useChat";
import { useConnectors } from "./hooks/useConnectors";
import type { ChatSession } from "./types";

export default function App() {
  const {
    sessions,
    activeChatId,
    messages,
    isLoading,
    statusText,
    loadSessions,
    selectChat,
    newChat,
    removeChat,
    sendMessage,
  } = useChat();

  const { status: connectorStatus, loading: connectorLoading, refresh: refreshConnectors } =
    useConnectors();

  const [showConnectors, setShowConnectors] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const activeSession: ChatSession | null =
    sessions.find((s) => s.chat_id === activeChatId) ?? null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F7F5] font-sans">
      {/* Sidebar — fixed width */}
      <Sidebar
        sessions={sessions}
        activeChatId={activeChatId}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={removeChat}
        onOpenConnectors={() => setShowConnectors(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main chat area */}
      <div className="flex-1 min-w-0">
        <ChatArea
          session={activeSession}
          messages={messages}
          isLoading={isLoading}
          statusText={statusText}
          onSend={sendMessage}
          onOpenConnectors={() => setShowConnectors(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      {showConnectors && (
        <ConnectorsModal
          status={connectorStatus}
          onClose={() => setShowConnectors(false)}
          onRefresh={refreshConnectors}
          loading={connectorLoading}
        />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
