"use client";

import { Minus, Plus } from "lucide-react";
import { updatePlan } from "@/lib/app-store";
import { formatEur } from "@/lib/format";
import type { ChoiceOption, Effect, Levers } from "@/lib/levers";

const TONE: Record<Effect["tone"], string> = {
  better: "text-positive",
  worse: "text-negative",
  same: "text-muted",
};

function EffectText({ effect }: { effect: Effect | null }) {
  if (!effect) return null;
  return <span className={`text-xs font-medium ${TONE[effect.tone]}`}>{effect.text}</span>;
}

function Choices<T>({ title, options, onSelect }: { title: string; options: ChoiceOption<T>[]; onSelect: (value: T) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div role="group" aria-label={title} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={option.selected}
            onClick={() => onSelect(option.value)}
            className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left ${
              option.selected ? "border-accent bg-accent/10" : "border-border hover:bg-border/40"
            }`}
          >
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted">{option.detail}</span>
            {!option.selected && <EffectText effect={option.effect} />}
          </button>
        ))}
      </div>
    </div>
  );
}

/** "What changes the answer": the controls that move it most, each with its effect. */
export function LeversSection({ levers }: { levers: Levers }) {
  const { monthly } = levers;
  return (
    <section aria-labelledby="levers-title" className="space-y-3">
      <h2 id="levers-title" className="text-sm font-semibold uppercase tracking-wide text-muted">
        What changes the answer
      </h2>
      <div className="space-y-5 rounded-xl border border-border bg-card p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">You add each month</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={`${formatEur(monthly.step)} less a month`}
              disabled={!monthly.down}
              onClick={() => updatePlan({ monthlyContribution: Math.max(0, monthly.value - monthly.step) })}
              className="flex size-11 items-center justify-center rounded-full border border-border hover:bg-border/40 disabled:opacity-40"
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <p className="min-w-24 text-center text-2xl font-semibold" aria-live="polite">
              {formatEur(monthly.value)}
            </p>
            <button
              type="button"
              aria-label={`${formatEur(monthly.step)} more a month`}
              onClick={() => updatePlan({ monthlyContribution: monthly.value + monthly.step })}
              className="flex size-11 items-center justify-center rounded-full border border-border hover:bg-border/40"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>
              +{formatEur(monthly.step)}: <EffectText effect={monthly.up} />
            </span>
            {monthly.down && (
              <span>
                −{formatEur(monthly.step)}: <EffectText effect={monthly.down} />
              </span>
            )}
          </p>
        </div>

        <Choices title="Invested in" options={levers.investment} onSelect={(investment) => updatePlan({ investment })} />
        <Choices title="Look at" options={levers.horizon} onSelect={(horizonYears) => updatePlan({ horizonYears })} />
        {levers.withdrawal && (
          <Choices
            title="Taking out a year"
            options={levers.withdrawal}
            onSelect={(withdrawalRate) => updatePlan({ withdrawalRate })}
          />
        )}
      </div>
    </section>
  );
}
