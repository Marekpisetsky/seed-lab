"use client";

import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { SettledNumberInput } from "@/components/ui/form";
import { updatePlan } from "@/lib/app-store";
import { formatPercent } from "@/lib/format";
import { INDEXES } from "@/lib/indexes";
import { MAX_PARTS, mixModel, refName, resolveRef, splitEvenly, stockTerms, sumsTo100, usesFallback } from "@/lib/mix";
import type { MixPart } from "@/lib/types";
import { FALLBACK_FACTOR, MIN_DATA_YEARS } from "@/lib/volatility";

type Mix = { kind: "mix"; parts: MixPart[]; rebalance: boolean };

function partDetail(ref: string): string {
  const target = resolveRef(ref);
  if (!target) return "";
  return target.kind === "index" ? `index, e.g. ${INDEXES[target.index].etf}` : `${target.instrument.id}, grows like the ${INDEXES[target.instrument.index].name}`;
}

function Total({ parts }: { parts: readonly MixPart[] }) {
  const total = parts.reduce((sum, part) => sum + part.weight, 0);
  const ok = sumsTo100(parts);
  const off = Math.abs(100 - total);
  const amount = `${Number(off.toFixed(2))}%`;
  return (
    <p role="status" className={`text-sm font-medium tabular-nums ${ok ? "text-positive" : "text-warning-foreground"}`}>
      {ok && <Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />}
      Total {Number(total.toFixed(2))}%
      {!ok && <span className="font-normal"> — {total < 100 ? `${amount} left to place` : `${amount} too much`}; the result uses the last mix that added up to 100%</span>}
    </p>
  );
}

/** How the mix is simulated, in plain words, with each stock's figures. */
function HowItWorks({ mix }: { mix: Mix }) {
  const model = mixModel(mix.parts, mix.rebalance);
  const stocks = model ? stockTerms(model) : [];
  return (
    <details className="group rounded-md text-xs text-muted">
      <summary className="cursor-pointer list-none font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="mr-1 inline-flex size-4 items-center justify-center rounded-full border border-current text-[10px]">
          i
        </span>
        How this mix is worked out
      </summary>
      <div className="mt-2 space-y-2">
        <p>
          <strong className="font-medium text-foreground">Growth:</strong> the weighted average of the index behind each part (a stock&apos;s own past is
          never projected).
        </p>
        <p>
          <strong className="font-medium text-foreground">Ups and downs:</strong> 1,000 simulated paths. Each year, one historical year of 1988–2022 is
          drawn for the three indexes together, so they rise and fall as they did. A stock moves with its index as much as its weekly prices did, plus a
          part of its own, so that it swings as much as its daily closes show; two stocks move together as much as their weekly prices did.
        </p>
        {stocks.length > 0 && (
          <ul className="space-y-0.5">
            {stocks.map((term) => (
              <li key={term.ref}>
                {refName(term.ref)}: swings {formatPercent(term.volatility, { decimals: 0 })} a year, correlation{" "}
                {term.correlation.toFixed(2)} with its index.
              </li>
            ))}
          </ul>
        )}
        {model && usesFallback(model) && (
          <p>
            Where a stock has under {MIN_DATA_YEARS} years of prices, it is taken to swing {FALLBACK_FACTOR} times as much as its index; where it has
            no three years shared with its index&apos;s ETF, it takes the typical correlation of the stocks that do.
          </p>
        )}
        <p>
          <strong className="font-medium text-foreground">Weights:</strong> “Let weights drift” lets each part grow on its own (money added each month is
          split by the weights); “Rebalance every year” goes back to the weights every year.
        </p>
        <p>
          <strong className="font-medium text-foreground">Worst year in the data:</strong> the mix&apos;s worst calendar year, back at its weights each
          January, over the years every part has data (a stock&apos;s price change less US inflation). Past, not a promise.
        </p>
        <p>The app does not suggest weights: it shows what the ones you choose do.</p>
      </div>
    </details>
  );
}

/**
 * The parts of a mix and their weights, which must add up to 100%. While
 * they do not, the result keeps the last mix that did. The app never
 * suggests weights.
 */
export function MixEditor({ mix, onAddPart }: { mix: Mix; onAddPart: (anchor: HTMLElement) => void }) {
  const [draft, setDraft] = useState<MixPart[]>(mix.parts);
  const [seen, setSeen] = useState<Mix>(mix);
  // The plan's parts changed elsewhere (a part added, a file loaded): show them. A new
  // "drift or rebalance" alone keeps weights still being typed.
  if (mix !== seen) {
    const parts = JSON.stringify(mix.parts);
    if (parts !== JSON.stringify(seen.parts) && parts !== JSON.stringify(draft)) setDraft(mix.parts);
    setSeen(mix);
  }

  const edit = (next: MixPart[]) => {
    setDraft(next);
    if (sumsTo100(next)) updatePlan({ investment: { kind: "mix", parts: next, rebalance: mix.rebalance } });
  };

  return (
    <div className="order-4 col-span-2 space-y-3 rounded-lg bg-background p-3 sm:order-5 sm:col-span-4">
      <ul className="space-y-2">
        {draft.map((part, index) => (
          <li key={part.ref} className="flex items-center gap-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{refName(part.ref)}</span>
              <span className="block truncate text-xs text-muted">{partDetail(part.ref)}</span>
            </span>
            <span className="relative w-24 shrink-0">
              <SettledNumberInput
                aria-label={`Weight of ${refName(part.ref)}, in percent`}
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
              aria-label={`Remove ${refName(part.ref)}`}
              disabled={draft.length === 1}
              onClick={() => edit(draft.filter((_, position) => position !== index))}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-border/40 hover:text-foreground disabled:opacity-30"
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
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-40"
          >
            <Plus aria-hidden="true" className="size-4" /> Add
          </button>
          <button type="button" onClick={() => edit(splitEvenly(draft))} className="rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-accent/10">
            Split evenly
          </button>
        </span>
      </div>
      <div role="radiogroup" aria-label="Weights over time" className="inline-flex rounded-md border border-border p-0.5 text-xs">
        {[false, true].map((rebalance) => (
          <button
            key={String(rebalance)}
            type="button"
            role="radio"
            aria-checked={mix.rebalance === rebalance}
            onClick={() => updatePlan({ investment: { ...mix, rebalance } })}
            className={`rounded px-2 py-1 font-medium ${mix.rebalance === rebalance ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
          >
            {rebalance ? "Rebalance every year" : "Let weights drift"}
          </button>
        ))}
      </div>
      <HowItWorks mix={mix} />
    </div>
  );
}
