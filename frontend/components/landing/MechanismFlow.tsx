"use client";

import { motion } from "framer-motion";

const STAGES = [
  {
    label: "01",
    title: "Embed",
    body: "Every query is embedded locally (all-MiniLM-L6-v2) — no API call, no cost, before any routing decision is made.",
    visual: <EmbedVisual />,
  },
  {
    label: "02",
    title: "Compare",
    body: "Cosine similarity against every past query. Above 0.92, it's the same question in different words.",
    visual: <CompareVisual />,
  },
  {
    label: "03",
    title: "Decide",
    body: "Above threshold → return the cached answer, zero LLM cost. Otherwise, a cheap heuristic (length, complexity, question count) picks small or large — never an LLM deciding on itself.",
    visual: <DecideVisual />,
  },
  {
    label: "04",
    title: "Log",
    body: "Every request, hit or miss, logs cost and latency to your account — the numbers behind your dashboard.",
    visual: <LogVisual />,
  },
];

export function MechanismFlow() {
  return (
    <section id="mechanism" className="mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-24">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl text-2xl font-semibold tracking-tight text-fg sm:text-3xl"
      >
        What actually happens between your query and an answer
      </motion.h2>

      <div className="relative mt-14 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-4">
        <div className="pointer-events-none absolute left-0 right-0 top-[4.5rem] hidden h-px bg-border md:block" />
        {STAGES.map((stage, i) => (
          <motion.div
            key={stage.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col gap-4"
          >
            <div className="relative z-10 flex h-36 w-full items-center justify-center rounded-2xl border border-border bg-bg-elevated">
              {stage.visual}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-fg-muted">{stage.label}</span>
              <h3 className="text-base font-semibold text-fg">{stage.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-fg-muted">{stage.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function EmbedVisual() {
  const dots = Array.from({ length: 24 });
  return (
    <div className="grid grid-cols-6 gap-1.5 p-4">
      {dots.map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-accent"
          style={{ opacity: 0.25 + ((i * 37) % 100) / 130 }}
        />
      ))}
    </div>
  );
}

function CompareVisual() {
  return (
    <div className="flex w-full flex-col gap-2 px-6">
      <div className="flex justify-between font-mono text-[10px] text-fg-muted">
        <span>0.00</span>
        <span className="text-accent">0.92 threshold</span>
        <span>1.00</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-bg-subtle">
        <div className="absolute inset-y-0 left-0 w-[92%] rounded-full bg-accent/30" />
        <div className="absolute inset-y-0 left-[96%] w-2.5 -translate-x-1/2 rounded-full bg-good ring-2 ring-bg-elevated" />
      </div>
    </div>
  );
}

function DecideVisual() {
  return (
    <div className="flex w-full items-center justify-center gap-3 px-4 font-mono text-[11px]">
      <div className="flex flex-col items-center gap-1">
        <span className="rounded-full bg-good-soft px-2 py-1 text-good">hit</span>
        <span className="text-fg-muted">cached</span>
      </div>
      <span className="text-fg-muted">/</span>
      <div className="flex flex-col items-center gap-1">
        <span className="rounded-full bg-accent-soft px-2 py-1 text-accent">small</span>
        <span className="text-fg-muted">haiku</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="rounded-full bg-accent-soft px-2 py-1 text-accent">large</span>
        <span className="text-fg-muted">sonnet</span>
      </div>
    </div>
  );
}

function LogVisual() {
  const bars = [0.3, 0.55, 0.25, 0.7, 0.4, 0.6];
  return (
    <div className="flex h-16 items-end gap-1.5">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-2 rounded-t bg-accent/60"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}
