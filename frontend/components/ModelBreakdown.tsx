"use client";

import { motion } from "framer-motion";
import { Stats } from "@/lib/types";

const PALETTE = ["var(--accent)", "var(--warn)", "var(--bad)", "var(--good)"];

export function ModelBreakdown({ stats }: { stats: Stats }) {
  const entries = Object.entries(stats.requests_by_model).filter(
    ([, count]) => count > 0,
  );
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm">
      <h3 className="text-sm font-medium text-fg-muted">Requests by model</h3>

      {entries.length === 0 ? (
        <p className="mt-6 text-sm text-fg-muted">
          No model calls yet — every query so far has been a cache hit, or
          there's no data.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map(([model, count], i) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={model}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-fg" title={model}>
                    {model}
                  </span>
                  <span className="text-fg-muted">
                    {count} · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
