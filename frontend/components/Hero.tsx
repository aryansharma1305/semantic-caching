"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { StatusBanner } from "./StatusBanner";
import { ConnectionState } from "@/lib/types";

export function Hero({
  state,
  lastUpdated,
}: {
  state: ConnectionState;
  lastUpdated: Date | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const targets = rootRef.current.querySelectorAll("[data-hero-item]");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      targets,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 },
    );
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col gap-3">
      <div
        data-hero-item
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs font-medium text-fg-muted"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Semantic Caching & Cost-Aware Router
      </div>
      <h1
        data-hero-item
        className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl"
      >
        Cache &amp; routing analytics
      </h1>
      <p data-hero-item className="max-w-xl text-sm text-fg-muted sm:text-base">
        Live cost, latency, and cache-hit telemetry for the RAG service —
        polling the FastAPI backend every few seconds, read-only.
      </p>
      <div data-hero-item>
        <StatusBanner state={state} lastUpdated={lastUpdated} />
      </div>
    </div>
  );
}
