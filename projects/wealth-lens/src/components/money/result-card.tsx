"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

/**
 * A folded result: one line with what it says in a sentence, and an arrow.
 * Opened, it shows the details, which are only loaded and worked out then.
 */
export function ResultCard({ title, summary, tone = "plain", children }: { title: string; summary?: string; tone?: "plain" | "warning"; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <section className={`rounded-xl border bg-card ${tone === "warning" ? "border-warning-border" : "border-border"}`}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen(!open)}
          className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
        >
          <span className="min-w-0 flex-1 text-base">
            <span className="font-semibold">{title}</span>
            {summary && <span className={`block text-sm sm:ml-2 sm:inline ${tone === "warning" ? "text-warning-foreground" : "text-muted"}`}>{summary}</span>}
          </span>
          <ChevronDown aria-hidden="true" className={`size-5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {open && (
        <div id={panel} className="border-t border-border px-4 py-4">
          {children}
        </div>
      )}
    </section>
  );
}
