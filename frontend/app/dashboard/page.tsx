"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useDashboardData } from "@/lib/useDashboardData";
import { Hero } from "@/components/Hero";
import { StatCard } from "@/components/StatCard";
import { LatencyComparison } from "@/components/LatencyComparison";
import { ModelBreakdown } from "@/components/ModelBreakdown";
import { QueriesFeed } from "@/components/QueriesFeed";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ApiTokensPanel } from "@/components/ApiTokensPanel";

export default function DashboardPage() {
  const { stats, queries, state, lastUpdated } = useDashboardData();

  const misses = Math.max(stats.total_queries - stats.cache_hits, 0);
  const avgMissCost = misses > 0 ? stats.total_cost_usd / misses : 0;
  const costSaved = stats.cache_hits * avgMissCost;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <Hero state={state} lastUpdated={lastUpdated} />
        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-fg-muted transition hover:text-fg"
          >
            Docs
          </Link>
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-fg-muted transition hover:text-fg"
          >
            Home
          </Link>
          <ApiTokensPanel />
          <SettingsPanel />
          <UserButton />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total queries" value={stats.total_queries} index={0} />
        <StatCard
          label="Cache hit rate"
          value={stats.cache_hit_rate * 100}
          decimals={1}
          suffix="%"
          accent="good"
          index={1}
        />
        <StatCard
          label="Avg latency"
          value={stats.avg_latency_ms}
          decimals={0}
          suffix=" ms"
          index={2}
        />
        <StatCard
          label="Est. cost saved by caching"
          value={costSaved}
          decimals={4}
          prefix="$"
          accent="accent"
          hint="hits × avg. miss cost"
          index={3}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LatencyComparison queries={queries} />
        <ModelBreakdown stats={stats} />
      </section>

      <section>
        <QueriesFeed queries={queries} />
      </section>

      <footer className="pb-4 text-center text-xs text-fg-muted">
        Read-only dashboard · polls <code className="font-mono">/stats</code> and{" "}
        <code className="font-mono">/queries</code> every few seconds
      </footer>
    </div>
  );
}
