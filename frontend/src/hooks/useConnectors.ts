import { useState, useEffect, useCallback } from "react";
import type { ConnectorStatus } from "../types";
import { fetchConnectorStatus } from "../services/api";

const DEFAULT_STATUS: ConnectorStatus = {
  ollama: { running: false, model_available: false, model: "llama3.2" },
  imessage: false,
  mail: false,
  documents: { indexed: 0, available: false },
  model: "llama3.2",
};

export function useConnectors() {
  const [status, setStatus] = useState<ConnectorStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchConnectorStatus();
      setStatus(data);
    } catch {
      setStatus(DEFAULT_STATUS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { status, loading, refresh };
}
