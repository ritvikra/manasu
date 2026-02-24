import { useState, useCallback, useRef } from "react";
import type { Message, ChatSession } from "../types";
import {
  fetchHistory,
  fetchMessages,
  createChat,
  deleteChat,
  streamChat,
} from "../services/api";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchHistory();
      setSessions(data);
    } catch {
      // backend may not be running yet
    }
  }, []);

  const selectChat = useCallback(async (chatId: string) => {
    setActiveChatId(chatId);
    setMessages([]);
    try {
      const msgs = await fetchMessages(chatId);
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  }, []);

  const newChat = useCallback(async () => {
    try {
      const { chat_id, title } = await createChat("New Chat");
      const session: ChatSession = {
        chat_id,
        title,
        preview: "",
        timestamp: new Date().toISOString(),
      };
      setSessions((prev) => [session, ...prev]);
      setActiveChatId(chat_id);
      setMessages([]);
    } catch {
      // If backend offline, create a local session
      const chat_id = makeId();
      setSessions((prev) => [
        { chat_id, title: "New Chat", preview: "", timestamp: new Date().toISOString() },
        ...prev,
      ]);
      setActiveChatId(chat_id);
      setMessages([]);
    }
  }, []);

  const removeChat = useCallback(async (chatId: string) => {
    try {
      await deleteChat(chatId);
    } catch {}
    setSessions((prev) => prev.filter((s) => s.chat_id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }
  }, [activeChatId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      let chatId = activeChatId;

      // Auto-create chat if none selected
      if (!chatId) {
        try {
          const res = await createChat("New Chat");
          chatId = res.chat_id;
          const session: ChatSession = {
            chat_id: chatId,
            title: "New Chat",
            preview: "",
            timestamp: new Date().toISOString(),
          };
          setSessions((prev) => [session, ...prev]);
          setActiveChatId(chatId);
        } catch {
          chatId = makeId();
          setActiveChatId(chatId);
        }
      }

      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const assistantMsgId = makeId();
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(true);
      setStatusText("");

      abortRef.current?.abort();
      abortRef.current = streamChat(chatId, text, (event) => {
        if (event.type === "status") {
          setStatusText(event.content);
        } else if (event.type === "token") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + event.content }
                : m
            )
          );
        } else if (event.type === "done") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, isStreaming: false } : m
            )
          );
          setIsLoading(false);
          setStatusText("");
          // Refresh sessions to get updated title/preview
          loadSessions();
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: `Error: ${event.content}`,
                    isStreaming: false,
                  }
                : m
            )
          );
          setIsLoading(false);
          setStatusText("");
        }
      });
    },
    [activeChatId, isLoading, loadSessions]
  );

  return {
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
  };
}
