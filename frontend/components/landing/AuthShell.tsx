"use client";

import { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-accent p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="h-2 w-2 rounded-full bg-white" />
          Semantic Router
        </Link>

        <div className="flex flex-col gap-4">
          <p className="max-w-sm text-2xl font-semibold leading-snug tracking-tight">
            Skip the model call for every question you&apos;ve already answered.
          </p>
          <p className="max-w-sm text-sm text-white/75">
            Semantic caching + cost-aware routing, live on your own dashboard the
            moment you add a key.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/15 pt-4 font-mono text-xs text-white/60">
          <span>&gt; cache hit · 9ms · $0.00000</span>
          <span>&gt; routed → haiku-4.5 · 412ms · $0.00031</span>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-bg px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 60% 50% at 50% 45%, black 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mb-8 flex items-center gap-2 lg:hidden">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-sm font-semibold text-fg">Semantic Router</span>
        </div>
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
