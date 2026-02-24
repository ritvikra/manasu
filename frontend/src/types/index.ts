export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  chat_id: string;
  title: string;
  preview: string;
  timestamp: string;
}

export interface ConnectorStatus {
  ollama: {
    running: boolean;
    model_available: boolean;
    model: string;
    available_models?: string[];
  };
  imessage: boolean;
  mail: boolean;
  documents: { indexed: number; available: boolean };
  model: string;
}

export interface DocumentItem {
  doc_id: string;
  filename: string;
  chunk_count: number;
  upload_date: string;
}

export type StreamEvent =
  | { type: "status"; content: string }
  | { type: "token"; content: string }
  | { type: "done"; chat_id: string }
  | { type: "error"; content: string };
