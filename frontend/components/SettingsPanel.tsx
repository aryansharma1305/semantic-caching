"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import {
  deleteApiKey,
  fetchApiKeys,
  fetchProviders,
  saveApiKey,
  setActiveProvider,
} from "@/lib/api";
import { ApiKeyInfo, ProviderInfo } from "@/lib/types";

// Security invariants for this component — do not casually "fix" these away:
// - The raw key only ever lives in `apiKeyInput` React state, in memory, for as long as
//   the user is typing. It is never written to localStorage/sessionStorage/cookies, never
//   logged (no console.log of it, ever), and is cleared immediately after a save attempt
//   (success or failure) and whenever the panel closes.
// - Every render of a stored key uses `masked_key` from the backend. The backend never
//   sends the raw key back over the wire after the initial POST's own request body.
export function SettingsPanel() {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = await getToken();
    const [p, k] = await Promise.all([fetchProviders(token), fetchApiKeys(token)]);
    setProviders(p);
    setKeys(k);
  }, [getToken]);

  useEffect(() => {
    if (!open) return;
    refresh().catch((e) => setError(String(e)));
  }, [open, refresh]);

  function close() {
    setOpen(false);
    setApiKeyInput(""); // discard raw key material as soon as the panel isn't visible
    setError(null);
    setConfirmDelete(null);
  }

  async function handleSave() {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      await saveApiKey(selectedProvider, apiKeyInput, token);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setApiKeyInput(""); // clear regardless of outcome — never leave it sitting around
      setSaving(false);
    }
  }

  async function handleDelete(provider: string) {
    if (confirmDelete !== provider) {
      setConfirmDelete(provider);
      return;
    }
    setConfirmDelete(null);
    try {
      const token = await getToken();
      await deleteApiKey(provider, token);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleActivate(provider: string) {
    try {
      const token = await getToken();
      await setActiveProvider(provider, token);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:text-fg"
        aria-label="API key settings"
      >
        <GearIcon />
        API keys
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
                <h2 className="text-sm font-semibold text-fg">Provider API keys</h2>
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
                Keys are encrypted at rest and never sent back to this page after saving —
                only a masked preview is shown below. Pick any configured provider to
                handle{" "}
                <code className="font-mono">/query</code> traffic.
              </p>

              <div className="mb-4 space-y-2">
                {keys.length === 0 && (
                  <p className="rounded-lg bg-bg-subtle px-3 py-2 text-xs text-fg-muted">
                    No providers configured yet.
                  </p>
                )}
                {keys.map((k) => {
                  const display =
                    providers.find((p) => p.provider === k.provider)?.display_name ??
                    k.provider;
                  return (
                    <div
                      key={k.provider}
                      className="flex items-center justify-between rounded-lg border border-border bg-bg-subtle px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-fg">
                          {display}
                          {k.active && (
                            <span className="ml-2 rounded-full bg-good-soft px-2 py-0.5 text-[10px] font-medium text-good">
                              active
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-xs text-fg-muted">
                          {k.masked_key}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!k.active && (
                          <button
                            type="button"
                            onClick={() => handleActivate(k.provider)}
                            className="text-xs font-medium text-accent hover:underline"
                          >
                            Use
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(k.provider)}
                          className={`text-xs font-medium hover:underline ${
                            confirmDelete === k.provider ? "text-bad" : "text-fg-muted"
                          }`}
                        >
                          {confirmDelete === k.provider ? "Confirm?" : "Remove"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex gap-2">
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-fg"
                  >
                    {providers.map((p) => (
                      <option key={p.provider} value={p.provider}>
                        {p.display_name}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="sk-..."
                      autoComplete="off"
                      className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 pr-9 text-sm text-fg placeholder:text-fg-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute inset-y-0 right-2 text-xs text-fg-muted hover:text-fg"
                      aria-label={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? "hide" : "show"}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !apiKeyInput.trim()}
                  className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save key"}
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

function GearIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.36 4.64l-1.41 1.41M6.05 13.95l-1.41 1.41M15.36 15.36l-1.41-1.41M6.05 6.05 4.64 4.64" />
    </svg>
  );
}
