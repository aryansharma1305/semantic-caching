"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { createToken, deleteToken, fetchTokens } from "@/lib/api";
import { ApiTokenInfo } from "@/lib/types";

// Security invariants — same posture as SettingsPanel's provider keys:
// - The plaintext token only ever exists in `justCreatedToken` React state, for as
//   long as this panel is open after creation. It is never written to
//   localStorage/sessionStorage/cookies, never logged, and is cleared on panel close.
// - Every other render of a token uses `prefix` from the backend — the full value is
//   never sent back over the wire after the creating request's own response.
export function ApiTokensPanel() {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<ApiTokenInfo[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCreatedToken, setJustCreatedToken] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const authToken = await getToken();
    setTokens(await fetchTokens(authToken));
  }, [getToken]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-open modal, same accepted pattern as SettingsPanel.tsx's provider-key list
    refresh().catch((e) => setError(String(e)));
  }, [open, refresh]);

  function close() {
    setOpen(false);
    setJustCreatedToken(null);
    setName("");
    setError(null);
    setConfirmDelete(null);
    setCopied(false);
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const authToken = await getToken();
      const result = await createToken(name.trim() || "Default", authToken);
      setJustCreatedToken(result.token);
      setName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    try {
      const authToken = await getToken();
      await deleteToken(id, authToken);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function copyToken() {
    if (!justCreatedToken) return;
    await navigator.clipboard.writeText(justCreatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:text-fg"
        aria-label="API tokens"
      >
        <KeyIcon />
        API access
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6 shadow-xl"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-fg">API tokens</h2>
                <button
                  type="button"
                  onClick={close}
                  className="text-fg-muted transition hover:text-fg"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <p className="mb-4 text-xs leading-relaxed text-fg-muted">
                Tokens let your own backend call{" "}
                <code className="font-mono">POST /query</code> without a browser
                session — pass one as{" "}
                <code className="font-mono">Authorization: Bearer &lt;token&gt;</code>.
                The full value is shown once, right after you create it.
              </p>

              {justCreatedToken && (
                <div className="mb-4 rounded-lg border border-good/30 bg-good-soft px-3 py-3">
                  <p className="mb-2 text-xs font-medium text-good">
                    Copy this now — it won&apos;t be shown again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-fg">
                      {justCreatedToken}
                    </code>
                    <button
                      type="button"
                      onClick={copyToken}
                      className="flex-none rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs font-medium text-fg hover:bg-bg-subtle"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4 space-y-2">
                {tokens.length === 0 && (
                  <p className="rounded-lg bg-bg-subtle px-3 py-2 text-xs text-fg-muted">
                    No API tokens yet.
                  </p>
                )}
                {tokens.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-bg-subtle px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-fg">{t.name}</span>
                      <span className="font-mono text-xs text-fg-muted">
                        {t.prefix}…
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className={`text-xs font-medium hover:underline ${
                        confirmDelete === t.id ? "text-bad" : "text-fg-muted"
                      }`}
                    >
                      {confirmDelete === t.id ? "Confirm?" : "Revoke"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Token name (e.g. production)"
                    className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create token"}
                </button>
                {error && <p className="text-xs text-bad">{error}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function KeyIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <circle cx="7" cy="13" r="3.5" />
      <path d="M9.5 10.5 16 4M13.5 6.5 16 4M15 8l2-2" strokeLinecap="round" />
    </svg>
  );
}
