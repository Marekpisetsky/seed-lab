"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { useI18n } from "@/components/i18n";

/** A part of the result with its title always in sight: never folded, only its long detail waits behind "See more". */
export function ResultSection({ title, tone = "plain", className = "", children }: { title: string; tone?: "plain" | "warning"; className?: string; children: React.ReactNode }) {
  const heading = useId();
  return (
    <section aria-labelledby={heading} className={`space-y-3 rounded-xl border bg-card p-4 sm:p-5 ${tone === "warning" ? "border-warning-border" : "border-border"} ${className}`}>
      <h2 id={heading} className="text-lg font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * "See more": a section's long detail, shown (and only then loaded and
 * worked out) when asked for. `what` names it for screen readers, since a
 * page holds more than one.
 */
export function SeeMore({ what, children }: { what: string; children: React.ReactNode }) {
  const { m } = useI18n();
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen(!open)}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-base font-medium text-accent hover:bg-accent/10"
      >
        {open ? m.cards.less : m.cards.more}
        <span className="sr-only">: {what}</span>
        <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={panel} className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}
