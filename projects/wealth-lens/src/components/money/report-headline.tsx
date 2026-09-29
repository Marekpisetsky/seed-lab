"use client";

import { Pin, X } from "lucide-react";
import { useState } from "react";
import { useReport } from "@/hooks/use-report";
import { updatePlan } from "@/lib/app-store";
import type { HeadlineNumber } from "@/lib/report";

type NumberKey = "today" | "when" | "value" | `instead-${number}`;

/** A number in the headline: big, and a button that says where it comes from. */
function HeadlineButton({ number, expanded, onToggle }: { number: HeadlineNumber; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls="headline-explain"
      onClick={onToggle}
      className="whitespace-nowrap text-3xl font-bold tracking-tight underline decoration-border decoration-2 underline-offset-[6px] hover:decoration-accent sm:text-4xl"
    >
      {number.text}
    </button>
  );
}

/**
 * The answer in one sentence with its two or three numbers, big. Tapping a
 * number shows where it comes from.
 */
export function ReportHeadline() {
  const { report } = useReport();
  const { headline, goal } = report;
  const [open, setOpen] = useState<NumberKey | null>(null);
  const numbers: Record<string, HeadlineNumber | undefined> = {
    today: headline.today,
    when: headline.future?.when,
    value: headline.future?.value,
    ...Object.fromEntries((headline.instead ?? []).map((option) => [`instead-${option.years}`, option.monthly])),
  };
  const explained = open ? numbers[open] : undefined;

  const button = (id: NumberKey, number: HeadlineNumber) => (
    <HeadlineButton number={number} expanded={open === id} onToggle={() => setOpen(open === id ? null : id)} />
  );

  return (
    <section aria-label="Answer" className="space-y-3">
      {headline.instead ? (
        <div className="space-y-2" aria-live="polite">
          <p className="text-xl leading-relaxed sm:text-2xl">
            {headline.lead} {button("today", headline.today)}.
          </p>
          <p className="text-2xl font-bold tracking-tight sm:text-3xl">Not reachable at this pace.</p>
          <p className="text-lg leading-relaxed">
            {headline.instead.map((option, index) => (
              <span key={option.years}>
                {index === 0 ? `To get there in ${option.years} years you'd add ` : ` In ${option.years} years, `}
                {button(`instead-${option.years}`, option.monthly)}
                .
              </span>
            ))}
          </p>
        </div>
      ) : (
        <p className="text-xl leading-relaxed sm:text-2xl" aria-live="polite">
          {headline.lead} {button("today", headline.today)}
          {headline.future ? (
            <>
              . In {button("when", headline.future.when)}: {button("value", headline.future.value)} — {headline.meaning}.
            </>
          ) : (
            <> — {headline.meaning}.</>
          )}
        </p>
      )}
      {explained && (
        <div id="headline-explain" className="rounded-lg border border-border bg-card p-3 text-sm">
          <ol className="space-y-1">
            {explained.explain.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>
      )}
      {goal.pinned && (
        <button
          type="button"
          onClick={() => updatePlan({ pinned: null })}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-3 py-1 text-sm"
          aria-label={`Your goal: ${goal.status.connection.name}. Remove it to see the next milestone.`}
        >
          <Pin aria-hidden="true" className="size-3.5" />
          {goal.status.connection.name}
          <X aria-hidden="true" className="size-3.5 text-muted" />
        </button>
      )}
    </section>
  );
}
