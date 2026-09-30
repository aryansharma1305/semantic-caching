"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SignUpButton } from "@clerk/nextjs";
import { QueryConsoleDemo } from "./QueryConsoleDemo";

export function LandingHero() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const targets = rootRef.current.querySelectorAll("[data-reveal]");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      targets,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.09 },
    );
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-8 sm:pb-20 sm:pt-24">
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <h1
            data-reveal
            className="text-4xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-[3.4rem]"
          >
            Stop paying your LLM twice for the same question.
          </h1>
          <p data-reveal className="max-w-xl text-base text-fg-muted sm:text-lg">
            Semantic Router sits in front of Anthropic and OpenAI. Near-duplicate
            questions get answered from cache instead of a fresh model call, and
            everything else is routed to the cheapest model that can still answer it
            well — decided before any LLM is touched, so the routing itself costs
            nothing.
          </p>
          <div data-reveal className="flex flex-wrap items-center gap-4 pt-2">
            <SignUpButton>
              <button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md shadow-accent/20 transition hover:opacity-90">
                Start for free
              </button>
            </SignUpButton>
            <a
              href="#mechanism"
              className="text-sm font-medium text-fg-muted underline decoration-border underline-offset-4 transition hover:text-fg"
            >
              See how the routing decision works
            </a>
          </div>
          <div data-reveal className="flex items-center gap-2 pt-2 text-xs text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-good" />
            Bring your own Anthropic or OpenAI key — encrypted at rest, never returned
            in plaintext.
          </div>
        </div>

        <div data-reveal>
          <QueryConsoleDemo />
        </div>
      </div>
    </section>
  );
}
