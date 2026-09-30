"use client";

import { motion } from "framer-motion";
import { QueryLogRow } from "@/lib/types";
import { AnimatedNumber } from "./AnimatedNumber";

interface LatencyComparisonProps {
  queries: QueryLogRow[];
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function LatencyComparison({ queries }: LatencyComparisonProps) {
  const hitLatencies = queries.filter((q) => q.cache_hit).map((q) => q.latency_ms);
  const missLatencies = queries.filter((q) => !q.cache_hit).map((q) => q.latency_ms);
  const hitAvg = average(hitLatencies);
  const missAvg = average(missLatencies);
  const max = Math.max(hitAvg, missAvg, 1);
  const hasData = hitLatencies.length > 0 || missLatencies.length > 0;

  const speedup = hitAvg > 0 && missAvg > 0 ? missAvg / hitAvg : null;

  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-fg-muted">
          Latency: cache hit vs. miss
        </h3>
        {speedup && speedup > 1 && (
          <span className="rounded-full bg-good-soft px-2.5 py-0.5 text-xs font-semibold text-good">
            {speedup.toFixed(1)}x faster on hit
          </span>
        )}
      </div>

      {!hasData ? (
        <p className="mt-6 text-sm text-fg-muted">
          No latency samples yet — run some queries to see the comparison.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <BarRow
            label="Cache hit"
            avg={hitAvg}
            max={max}
            count={hitLatencies.length}
            color="var(--good)"
            softColor="var(--good-soft)"
          />
          <BarRow
            label="Cache miss"
            avg={missAvg}
            max={max}
            count={missLatencies.length}
            color="var(--warn)"
            softColor="var(--warn-soft)"
          />
        </div>
      )}
    </div>
  );
}

function BarRow({
  label,
  avg,
  max,
  count,
  color,
  softColor,
}: {
  label: string;
  avg: number;
  max: number;
  count: number;
  color: string;
  softColor: string;
}) {
  const widthPct = max > 0 ? Math.max((avg / max) * 100, avg > 0 ? 3 : 0) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-fg">{label}</span>
        <span className="text-fg-muted">
          <AnimatedNumber value={avg} decimals={0} suffix=" ms" /> · {count} sample
          {count === 1 ? "" : "s"}
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full"
        style={{ background: softColor }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
