"use client";

import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/i18n";
import { SettledNumberInput } from "@/components/ui/form";
import { RadioGroup } from "@/components/ui/radio-group";
import { setInvestment } from "@/lib/app-store";
import { SAVINGS_RATE, type AssetId } from "@/lib/assets";
import type { I18n } from "@/i18n";
import { SERIES } from "@/lib/indexes";
import { MAX_PARTS, splitEvenly, sumsTo100, TEMPLATES, templateOf } from "@/lib/mix";
import type { MixPart } from "@/lib/types";
import { HowThisMixWorks } from "./explainers";

type Mix = { kind: "mix"; parts: MixPart[]; rebalance: boolean };

function partDetail(asset: AssetId, { m, f }: I18n): string {
  if (asset === "savings") return m.mix.part.savings(f.rate(SAVINGS_RATE));
  if (asset === "gold") return m.mix.part.gold(SERIES.gold.etf);
  return m.mix.part.asset(f.rate(SERIES[asset].averageReturn), SERIES[asset].etf);
}

function Total({ parts }: { parts: readonly MixPart[] }) {
  const { m, f } = useI18n();
  const total = parts.reduce((sum, part) => sum + part.weight, 0);
  const ok = sumsTo100(parts);
  const off = f.percent(Math.abs(100 - total) / 100, { decimals: Number.isInteger(total) ? 0 : 2 });
  return (
    <p role="status" className={`text-sm font-medium tabular-nums ${ok ? "text-positive" : "text-warning-foreground"}`}>
      {ok && <Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />}
      {m.mix.total(f.percent(total / 100, { decimals: Number.isInteger(total) ? 0 : 2 }))}
      {!ok && (
        <span className="block font-normal">
          {total < 100 ? m.mix.left(off) : m.mix.tooMuch(off)}. {m.mix.usingLast}
        </span>
      )}
    </p>
  );
}

/**
 * The parts of a mix and their weights, which must add up to 100%. While
 * they do not, the result keeps the last mix that did. Quick templates set
 * all the weights at once; the app never suggests weights.
 */
export function MixEditor({ mix, onAddPart }: { mix: Mix; onAddPart: (anchor: HTMLElement) => void }) {
  const i18n = useI18n();
  const { m } = i18n;
  const [draft, setDraft] = useState<MixPart[]>(mix.parts);
  const [seen, setSeen] = useState<Mix>(mix);
  // The plan's parts changed elsewhere (a part added, a template, a file loaded): show them. A new
  // "drift or rebalance" alone keeps weights still being typed.
  if (mix !== seen) {
    const parts = JSON.stringify(mix.parts);
    if (parts !== JSON.stringify(seen.parts) && parts !== JSON.stringify(draft)) setDraft(mix.parts);
    setSeen(mix);
  }

  const edit = (next: MixPart[]) => {
    setDraft(next);
    if (sumsTo100(next)) setInvestment({ kind: "mix", parts: next, rebalance: mix.rebalance });
  };
  const template = templateOf(mix.parts);

  return (
    <div className="col-span-2 space-y-3 rounded-lg bg-background p-3 sm:col-span-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">{m.mix.quick}</span>
        {TEMPLATES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={template === entry}
            onClick={() => edit(entry.parts.map((part) => ({ ...part })))}
            className={`min-h-11 rounded-md border px-3 py-1 font-medium ${template === entry ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-border/40"}`}
          >
            {m.mix.templates[entry.id]}
          </button>
        ))}
        <span className="text-muted">{m.mix.quickWhat}</span>
      </div>
      <ul className="space-y-2">
        {draft.map((part, index) => (
          <li key={part.asset} className="flex items-center gap-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{m.assets.name[part.asset]}</span>
              <span className="block truncate text-xs text-muted">{partDetail(part.asset, i18n)}</span>
            </span>
            <span className="relative w-24 shrink-0">
              <SettledNumberInput
                aria-label={m.mix.weightOf(m.assets.name[part.asset])}
                value={part.weight}
                max={100}
                onCommit={(weight) => edit(draft.map((entry, position) => (position === index ? { ...entry, weight: Math.min(100, weight) } : entry)))}
                className="pr-7 text-right text-base"
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
                %
              </span>
            </span>
            <button
              type="button"
              aria-label={m.mix.remove(m.assets.name[part.asset])}
              disabled={draft.length === 1}
              onClick={() => edit(draft.filter((_, position) => position !== index))}
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-border/40 hover:text-foreground disabled:opacity-30"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Total parts={draft} />
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            disabled={draft.length >= MAX_PARTS}
            onClick={(event) => onAddPart(event.currentTarget)}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-40"
          >
            <Plus aria-hidden="true" className="size-4" /> {m.mix.add}
          </button>
          <button type="button" onClick={() => edit(splitEvenly(draft))} className="min-h-11 rounded-md px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10">
            {m.mix.split}
          </button>
        </span>
      </div>
      <RadioGroup
        label={m.mix.weights}
        options={[
          { value: false, label: m.mix.drift },
          { value: true, label: m.mix.rebalance },
        ]}
        value={mix.rebalance}
        onChange={(rebalance) => setInvestment({ ...mix, rebalance })}
        className="inline-flex rounded-md border border-border p-0.5 text-xs"
        optionClassName={(checked) => `min-h-11 rounded px-3 py-1 font-medium ${checked ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
      />
      <HowThisMixWorks />
    </div>
  );
}
