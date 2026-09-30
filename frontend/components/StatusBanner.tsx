"use client";

import { motion } from "framer-motion";
import { ConnectionState } from "@/lib/types";

export function StatusBanner({
  state,
  lastUpdated,
}: {
  state: ConnectionState;
  lastUpdated: Date | null;
}) {
  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
        <Spinner />
        Connecting to the backend…
      </div>
    );
  }

  if (state === "error") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad"
      >
        <span className="h-2 w-2 flex-none rounded-full bg-bad" />
        Can&apos;t reach the API at <code className="font-mono">localhost:8321</code>.
        Start it with{" "}
        <code className="font-mono">uvicorn app.main:app --port 8321</code> and this
        page will reconnect automatically.
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-fg-muted">
      <span className="h-2 w-2 flex-none rounded-full bg-good" />
      Live · updated{" "}
      {lastUpdated
        ? lastUpdated.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "—"}
    </div>
  );
}

function Spinner() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fg-muted opacity-50" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-fg-muted" />
    </span>
  );
}
