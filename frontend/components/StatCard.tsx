"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { AnimatedNumber } from "./AnimatedNumber";

interface StatCardProps {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  accent?: "default" | "good" | "accent";
  icon?: ReactNode;
  index?: number;
}

export function StatCard({
  label,
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  hint,
  accent = "default",
  icon,
  index = 0,
}: StatCardProps) {
  const accentColor =
    accent === "good"
      ? "text-good"
      : accent === "accent"
        ? "text-accent"
        : "text-fg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon && <span className="text-fg-muted/70">{icon}</span>}
      </div>
      <div className={`mt-2 text-3xl font-semibold tracking-tight ${accentColor}`}>
        <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </div>
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </motion.div>
  );
}
