"use client";

import { AnimatePresence, motion } from "framer-motion";
import { QueryLogRow } from "@/lib/types";

function formatTs(ts: string): string {
  // SQLite datetime('now') is UTC, no timezone suffix — normalize so Date parses it correctly.
  const iso = ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function rowKey(row: QueryLogRow, idx: number): string {
  return `${row.ts}-${row.query}-${idx}`;
}

export function QueriesFeed({ queries }: { queries: QueryLogRow[] }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-medium text-fg-muted">Recent queries</h3>
        <span className="text-xs text-fg-muted">{queries.length} shown</span>
      </div>

      {queries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
          <p className="text-sm font-medium text-fg">No queries yet</p>
          <p className="max-w-xs text-xs text-fg-muted">
            Once requests hit <code className="rounded bg-bg-subtle px-1 py-0.5">POST /query</code>,
            they&apos;ll stream in here live.
          </p>
        </div>
      ) : (
        <div className="scrollbar-thin max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bg-elevated text-left text-xs text-fg-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Time</th>
                <th className="px-5 py-2 font-medium">Query</th>
                <th className="px-5 py-2 font-medium">Result</th>
                <th className="px-5 py-2 font-medium">Model</th>
                <th className="px-5 py-2 font-medium text-right">Cost</th>
                <th className="px-5 py-2 font-medium text-right">Latency</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {queries.map((row, idx) => (
                  <motion.tr
                    key={rowKey(row, idx)}
                    initial={{ opacity: 0, backgroundColor: "var(--accent-soft)" }}
                    animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                    transition={{ duration: 0.6 }}
                    className="border-b border-border last:border-0"
                  >
                    <td className="whitespace-nowrap px-5 py-2.5 text-fg-muted">
                      {formatTs(row.ts)}
                    </td>
                    <td className="max-w-[240px] truncate px-5 py-2.5 text-fg" title={row.query}>
                      {row.query}
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold " +
                          (row.cache_hit
                            ? "bg-good-soft text-good"
                            : "bg-warn-soft text-warn")
                        }
                      >
                        {row.cache_hit ? "Cache hit" : "Cache miss"}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-fg-muted">
                      {row.model_used ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right text-fg-muted">
                      {row.cost_usd != null ? `$${row.cost_usd.toFixed(5)}` : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right text-fg-muted">
                      {row.latency_ms.toFixed(0)} ms
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
