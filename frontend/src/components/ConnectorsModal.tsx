import type { ConnectorStatus } from "../types";

interface Props {
  status: ConnectorStatus;
  onClose: () => void;
  onRefresh: () => void;
  loading: boolean;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`w-2 h-2 rounded-full flex-shrink-0 ${
        ok ? "bg-[#16A34A]" : "bg-[#DC2626]"
      }`}
    />
  );
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#E4E4E7] last:border-0">
      <div className="flex items-center gap-3">
        <StatusDot ok={ok} />
        <div>
          <p className="text-[#18181B] text-sm font-medium">{label}</p>
          {detail && <p className="text-[#71717A] text-xs mt-0.5">{detail}</p>}
        </div>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded ${
          ok ? "text-[#16A34A]" : "text-[#DC2626]"
        }`}
      >
        {ok ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}

export function ConnectorsModal({ status, onClose, onRefresh, loading }: Props) {
  const ollamaOk = status.ollama.running && status.ollama.model_available;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-2xl border border-[#E4E4E7]
          w-full max-w-md mx-4 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#18181B] text-base font-semibold">Connectors</h2>
          <button
            onClick={onClose}
            className="text-[#A1A1AA] hover:text-[#18181B] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <StatusRow
            label="iMessage"
            ok={status.imessage}
            detail={
              status.imessage
                ? "Reading from ~/Library/Messages/chat.db"
                : "Grant Full Disk Access to Terminal in System Settings"
            }
          />
          <StatusRow
            label={`Ollama (${status.ollama.model})`}
            ok={ollamaOk}
            detail={
              !status.ollama.running
                ? "Run: ollama serve"
                : !status.ollama.model_available
                ? `Run: ollama pull ${status.ollama.model}`
                : `localhost:11434`
            }
          />
          <StatusRow
            label="Documents (RAG)"
            ok={false}
            detail="Coming in Phase 2"
          />
        </div>

        {!ollamaOk && (
          <div className="bg-[#FAFAFA] rounded-xl p-3 mb-4 border border-[#E4E4E7]">
            <p className="text-[#71717A] text-xs font-medium mb-1">Setup required</p>
            <p className="text-[#18181B] text-xs font-mono">
              {!status.ollama.running
                ? "ollama serve"
                : `ollama pull ${status.ollama.model}`}
            </p>
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-[#18181B] text-white text-sm
            font-medium hover:bg-[#3F3F46] transition-colors disabled:opacity-50"
        >
          {loading ? "Checking…" : "Refresh Status"}
        </button>
      </div>
    </div>
  );
}
