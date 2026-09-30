"use client";

import { motion } from "framer-motion";

const FACTS = [
  {
    term: "Encrypted at rest",
    detail: "Every provider key is Fernet-encrypted before it touches storage.",
  },
  {
    term: "Never returned",
    detail: "No endpoint — not even yours — can read a key back in plaintext.",
  },
  {
    term: "Per-account isolation",
    detail: "Every query and key is scoped to your verified account, server-side.",
  },
];

export function SecuritySection() {
  return (
    <section
      id="security"
      className="mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-24"
    >
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6"
        >
          <h2 className="max-w-md text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Your key, your spend. We route, we don&apos;t resell.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-fg-muted">
            Add your own Anthropic or OpenAI key and every query still goes to the
            provider you chose, at the provider&apos;s own rates. Our job is only to
            call it less often and pick the cheaper model when the question allows it.
          </p>
          <dl className="mt-2 flex flex-col divide-y divide-border">
            {FACTS.map((fact) => (
              <div key={fact.term} className="flex flex-col gap-1 py-4 first:pt-0">
                <dt className="text-sm font-semibold text-fg">{fact.term}</dt>
                <dd className="text-sm text-fg-muted">{fact.detail}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-elevated p-6"
        >
          <p className="font-mono text-xs text-fg-muted">POST /settings/api-key</p>
          <ProviderRow
            name="Anthropic"
            masked="sk-ant****************CDEF"
            active
          />
          <ProviderRow name="OpenAI" masked="sk-proj**************98fA" />
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-bg-subtle px-3 py-2.5 text-xs text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-good" />
            Masked on every read path — the plaintext key exists only for the
            duration of the request that encrypts it.
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProviderRow({
  name,
  masked,
  active = false,
}: {
  name: string;
  masked: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-subtle text-xs font-semibold text-fg">
          {name[0]}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-fg">{name}</span>
          <span className="font-mono text-xs text-fg-muted">{masked}</span>
        </div>
      </div>
      {active && (
        <span className="rounded-full bg-good-soft px-2 py-0.5 text-xs font-medium text-good">
          active
        </span>
      )}
    </div>
  );
}
