import { useRef, useState, useCallback } from "react";
import type { ConnectorStatus, DocumentItem } from "../types";
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  syncFolder,
} from "../services/api";

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
        ok ? "bg-[#22c55e]" : "bg-[#ef4444]"
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
    <div className="flex items-center justify-between py-3 border-b border-[#2d2d2d] last:border-0">
      <div className="flex items-center gap-3">
        <StatusDot ok={ok} />
        <div>
          <p className="text-white text-sm font-medium">{label}</p>
          {detail && <p className="text-[#9ca3af] text-xs mt-0.5">{detail}</p>}
        </div>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded ${
          ok ? "text-[#22c55e]" : "text-[#ef4444]"
        }`}
      >
        {ok ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

export function ConnectorsModal({ status, onClose, onRefresh, loading }: Props) {
  const ollamaOk = status.ollama.running && status.ollama.model_available;
  const docsIndexed = status.documents?.indexed ?? 0;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [syncResult, setSyncResult] = useState<string>("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const list = await fetchDocuments();
      setDocs(list);
      setDocsLoaded(true);
    } catch {
      setUploadError("Failed to load documents.");
    } finally {
      setDocsLoading(false);
    }
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError("");
    setDocsLoading(true);
    try {
      for (const file of files) {
        await uploadDocument(file);
      }
      await loadDocs();
      onRefresh();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setDocsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSync = async () => {
    if (!folderPath.trim()) return;
    setSyncLoading(true);
    setSyncResult("");
    setUploadError("");
    try {
      const res = await syncFolder(folderPath.trim());
      const errDetail = res.errors.map((e) => `${e.file}: ${e.error}`).join("; ");
      setSyncResult(
        `Indexed ${res.indexed} file(s), skipped ${res.skipped}${
          res.errors.length ? ` — Errors: ${errDetail}` : ""
        }.`
      );
      await loadDocs();
      onRefresh();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      setDocs((prev) => prev.filter((d) => d.doc_id !== docId));
      onRefresh();
    } catch {
      setUploadError("Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExpandDocs = () => {
    if (!docsLoaded) loadDocs();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-[#121212] rounded-2xl border border-white/[0.08]
          w-full max-w-xl mx-6 p-8 shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Connectors</h2>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Status rows */}
        <div className="space-y-4">
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
                : "localhost:11434"
            }
          />
          <StatusRow
            label="Apple Mail"
            ok={status.mail ?? false}
            detail={
              status.mail
                ? "Reading via AppleScript"
                : "Grant Automation → Terminal → Mail.app in System Settings"
            }
          />
        </div>

        {/* Ollama setup hint */}
        {!ollamaOk && (
          <div className="bg-[#1f1f1f] rounded-xl p-4 border border-white/[0.08] space-y-1">
            <p className="text-[#9ca3af] text-sm font-medium">Setup required</p>
            <p className="text-white text-sm font-mono">
              {!status.ollama.running
                ? "ollama serve"
                : `ollama pull ${status.ollama.model}`}
            </p>
          </div>
        )}

        {/* Documents section */}
        <div className="border border-white/[0.08] rounded-xl overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4 bg-[#1f1f1f] cursor-pointer"
            onClick={handleExpandDocs}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  docsIndexed > 0 ? "bg-[#22c55e]" : "bg-[#6b7280]"
                }`}
              />
              <div>
                <p className="text-white text-base font-medium">Documents (RAG)</p>
                <p className="text-[#9ca3af] text-sm mt-0.5">
                  {docsIndexed} document{docsIndexed !== 1 ? "s" : ""} indexed
                </p>
              </div>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[#9ca3af]"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>

          <div className="px-5 pb-5 pt-4 space-y-4">
            {/* Upload */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={handleUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={docsLoading}
                className="flex-1 py-3 rounded-lg bg-[#404040] text-white text-sm
                  font-medium hover:bg-[#525252] transition-colors disabled:opacity-50"
              >
                {docsLoading ? "Uploading…" : "Upload Files"}
              </button>
            </div>

            {/* Folder sync */}
            <div className="flex gap-2">
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="~/Documents"
                className="flex-1 px-4 py-3 rounded-lg border border-white/[0.08]
                  text-sm text-white placeholder-[#6b7280] outline-none
                  focus:border-[#404040] bg-[#1a1a1a]"
              />
              <button
                onClick={handleSync}
                disabled={syncLoading || !folderPath.trim()}
                className="px-4 py-3 rounded-lg bg-[#404040] text-white text-sm
                  font-medium hover:bg-[#525252] transition-colors disabled:opacity-50"
              >
                {syncLoading ? "Syncing…" : "Sync"}
              </button>
            </div>

            {syncResult && (
              <p className="text-[#22c55e] text-sm">{syncResult}</p>
            )}
            {uploadError && (
              <p className="text-[#ef4444] text-sm">{uploadError}</p>
            )}

            {/* Docs list */}
            {docsLoaded && (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {docs.length === 0 ? (
                  <p className="text-[#6b7280] text-sm text-center py-3">
                    No documents indexed yet.
                  </p>
                ) : (
                  docs.map((doc) => (
                    <div
                      key={doc.doc_id}
                      className="flex items-center justify-between px-3 py-2
                        rounded-lg hover:bg-[#1f1f1f] group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate">
                          {doc.filename}
                        </p>
                        <p className="text-[#9ca3af] text-xs">
                          {doc.chunk_count} chunk{doc.chunk_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.doc_id)}
                        disabled={deletingId === doc.doc_id}
                        className="ml-2 text-[#9ca3af] hover:text-[#ef4444]
                          transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Remove document"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {!docsLoaded && !docsLoading && (
              <p className="text-[#6b7280] text-sm text-center py-2">
                Click header to load document list
              </p>
            )}
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#404040] text-white text-base
            font-medium hover:bg-[#525252] transition-colors disabled:opacity-50"
        >
          {loading ? "Checking…" : "Refresh Status"}
        </button>
      </div>
    </div>
  );
}
