"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface DemoStep {
  query: string;
  outcome: "hit" | "miss";
  tier?: "small" | "large";
  model?: string;
  similarity?: number;
  cost: number;
  latencyMs: number;
}

// Real routing/caching behavior (app/router.py, app/semantic_cache.py), dramatized with
// illustrative numbers — not a claim about any specific account's measured results.
const STEPS: DemoStep[] = [
  {
    query: "What's the refund policy for enterprise plans?",
    outcome: "miss",
    tier: "small",
    model: "haiku-4.5",
    cost: 0.00031,
    latencyMs: 412,
  },
  {
    query: "whats the refund policy for enterprise plans",
    outcome: "hit",
    similarity: 0.96,
    cost: 0,
    latencyMs: 9,
  },
  {
    query: "Compare the trade-offs of our failover design, step by step",
    outcome: "miss",
    tier: "large",
    model: "sonnet-5",
    cost: 0.00412,
    latencyMs: 1180,
  },
  {
    query: "How do I reset my password?",
    outcome: "miss",
    tier: "small",
    model: "haiku-4.5",
    cost: 0.00028,
    latencyMs: 388,
  },
];

export function QueryConsoleDemo() {
  const [lines, setLines] = useState<
    Array<{ step: DemoStep; typed: string; revealed: boolean }>
  >([]);
  const indexRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    let cancelled = false;

    async function runStep() {
      if (cancelled) return;
      const step = STEPS[indexRef.current % STEPS.length];
      indexRef.current += 1;

      setLines((prev) => {
        const next = [...prev, { step, typed: "", revealed: false }];
        return next.slice(-4);
      });

      const typed = { current: "" };
      await new Promise<void>((resolve) => {
        gsap.to(typed, {
          duration: Math.min(step.query.length * 0.028, 1.4),
          ease: "none",
          onUpdate: function () {
            const progress = this.progress();
            const chars = Math.round(step.query.length * progress);
            const text = step.query.slice(0, chars);
            setLines((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last) copy[copy.length - 1] = { ...last, typed: text };
              return copy;
            });
          },
          onComplete: resolve,
        });
      });

      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 260));
      setLines((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last) copy[copy.length - 1] = { ...last, revealed: true };
        return copy;
      });

      await new Promise((r) => setTimeout(r, 1900));
      if (!cancelled) runStep();
    }

    runStep();
    return () => {
      cancelled = true;
      runningRef.current = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lg"
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-bad/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-good/70" />
        <span className="ml-2 font-mono text-xs text-fg-muted">
          POST /query — live preview
        </span>
      </div>

      <div className="flex min-h-[15rem] flex-col justify-end gap-3 p-5 font-mono text-sm sm:min-h-[19rem]">
        {lines.map((line, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2 text-fg">
              <span className="text-accent">&gt;</span>
              <span>{line.typed}</span>
              {!line.revealed && (
                <span className="inline-block h-4 w-[2px] animate-pulse bg-accent" />
              )}
            </div>
            {line.revealed && (
              <div
                className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-4 text-xs opacity-0"
                style={{ animation: "fadeIn 0.4s ease-out forwards" }}
              >
                {line.step.outcome === "hit" ? (
                  <>
                    <span className="rounded-full bg-good-soft px-2 py-0.5 font-medium text-good">
                      cache hit · {Math.round((line.step.similarity ?? 0) * 100)}% match
                    </span>
                    <span className="text-fg-muted">
                      {line.step.latencyMs}ms · $0.00000
                    </span>
                  </>
                ) : (
                  <>
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
                      routed → {line.step.model}
                    </span>
                    <span className="text-fg-muted">
                      {line.step.latencyMs}ms · ${line.step.cost.toFixed(5)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-2.5 text-xs text-fg-muted">
        Simulated preview — connect a provider key to see your own hit rate and spend.
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
