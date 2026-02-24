import axios from "axios";
import type { ChatSession, ConnectorStatus, StreamEvent, Message } from "../types";

const BASE_URL = "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

export async function fetchHistory(): Promise<ChatSession[]> {
  const res = await api.get<ChatSession[]>("/history");
  return res.data;
}

export async function fetchMessages(chatId: string): Promise<Message[]> {
  const res = await api.get<Array<{ role: string; content: string; timestamp: string }>>(
    `/history/${chatId}/messages`
  );
  return res.data.map((m, i) => ({
    id: `${chatId}-${i}`,
    role: m.role === "human" ? "user" : "assistant",
    content: m.content,
    timestamp: m.timestamp,
  }));
}

export async function deleteChat(chatId: string): Promise<void> {
  await api.delete(`/history/${chatId}`);
}

export async function createChat(title = "New Chat"): Promise<{ chat_id: string; title: string }> {
  const res = await api.post("/history", { title });
  return res.data;
}

export async function fetchConnectorStatus(): Promise<ConnectorStatus> {
  const res = await api.get<ConnectorStatus>("/connectors/status");
  return res.data;
}

export function streamChat(
  chatId: string | null,
  message: string,
  onEvent: (event: StreamEvent) => void
): AbortController {
  const controller = new AbortController();

  fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message }),
    signal: controller.signal,
  })
    .then(async (res) => {
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as StreamEvent;
              onEvent(event);
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onEvent({ type: "error", content: String(err) });
      }
    });

  return controller;
}

export async function checkHealth(): Promise<boolean> {
  try {
    await api.get("/health", { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export interface Settings {
  temperature: number;
  model: string;
  ollama_url: string;
}

export async function fetchSettings(): Promise<Settings> {
  const res = await api.get<Settings>("/settings");
  return res.data;
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  const res = await api.post<Settings>("/settings", settings);
  return res.data;
}
