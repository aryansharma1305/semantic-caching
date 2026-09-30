"use client";

import { motion } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";

export function FinalCta() {
  return (
    <section className="px-4 pb-24 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-3xl bg-accent px-8 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-14"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Add a key. Send a query. Watch the second one cost nothing.
          </h2>
          <p className="max-w-lg text-sm text-white/80">
            No pricing tier, no setup call — sign up and you&apos;re on the dashboard
            in under a minute.
          </p>
        </div>
        <SignUpButton>
          <button className="flex-none rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent shadow-md transition hover:opacity-90">
            Start for free
          </button>
        </SignUpButton>
      </motion.div>
    </section>
  );
}
