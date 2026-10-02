"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { countryName } from "@/i18n/countries";
import { simulationsText } from "@/i18n/investment-text";
import { dearestCovered, type CountryRow } from "@/lib/calculator";
import { formatShare, gainedShareOf, growsText } from "@/lib/growth";
import { bandsFor } from "@/lib/projections";

/** How much it could pay, and how often that lasted: its code loads when its figure is tapped. */
const PayDetails = dynamic(() => import("./pay-details").then((module) => module.PayDetails));

export const FACT_IDS = ["putIn", "grows", "pays", "bad", "good", "lives"] as const;
export type FactId = (typeof FACT_IDS)[number];

interface Fact {
  id: FactId;
  value: string;
  /** Small, under the value. */
  note?: string;
  /** Where it comes from, shown when the figure is tapped. */
  from: React.ReactNode;
}

/** The cheapest country, for when none is paid yet. */
function cheapest(rows: readonly CountryRow[]): CountryRow | null {
  return rows[0] ?? null;
}

/** Every figure of the grid, from what the calculation already holds; the bad and good cases are the simulations' 10th and 90th. */
function factsOf(bundle: CalculationBundle, i18n: I18n): Fact[] {
  const { m, f } = i18n;
  const t = m.facts;
  const { calc } = bundle;
  const { scenario, investment, result } = calc;
  const years = result.years;
  const share = gainedShareOf(result);
  const steady = investment.volatility <= 0;
  const bands = steady ? null : bandsFor(investment, { start: scenario.capital, monthly: scenario.monthly, years });
  const of = simulationsText(investment, i18n);
  // The same country the table of "Where it reaches" shows among its first rows (lib/calculator.ts).
  const dearest = dearestCovered(calc.countries);
  const paid = m.result.perMonth(f.smallEur(result.income));
  const lives = dearest ?? cheapest(calc.countries);
  return [
    { id: "putIn", value: f.eur(result.putIn), from: t.putInFrom(f.eur(scenario.capital), f.eur(scenario.monthly), m.units.years(years)) },
    {
      id: "grows",
      value: f.eur(result.growth),
      note: share === null ? undefined : formatShare(share, i18n),
      from: `${t.growsFrom} ${share === null ? growsText(result.growthRate, i18n) : m.result.growthLine(growsText(result.growthRate, i18n), formatShare(share, i18n))}.`,
    },
    { id: "pays", value: f.smallEur(result.income), from: <PayDetails bundle={bundle} /> },
    { id: "bad", value: f.eur(bands ? bands.p10[years] : result.total), from: bands ? t.badFrom(of) : m.chart.noUps },
    { id: "good", value: f.eur(bands ? bands.p90[years] : result.total), from: bands ? t.goodFrom(of) : m.chart.noUps },
    {
      id: "lives",
      value: dearest ? countryName(dearest.code, i18n) : t.none,
      from: lives ? (dearest ? t.livesFrom : t.livesNone)(countryName(lives.code, i18n), f.eur(lives.withoutHousing.amount), paid) : "",
    },
  ];
}

/**
 * Under the big number, always there: six figures in a grid, two across on
 * a phone and three on a wide screen. Each is a button: tapped, the line
 * under the grid says where it comes from (for "Could pay you", the share
 * taken out and how often it lasted); tapped again, it closes.
 */
export function KeyFacts({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const { m } = i18n;
  const [open, setOpen] = useState<FactId | null>(null);
  const panel = useId();
  const facts = factsOf(bundle, i18n);
  const opened = facts.find((fact) => fact.id === open);
  return (
    <section aria-label={m.facts.label} className="space-y-2">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {facts.map((fact) => {
          const pressed = fact.id === open;
          return (
            <li key={fact.id} className="min-w-0">
              <button
                type="button"
                aria-expanded={pressed}
                aria-controls={panel}
                onClick={() => setOpen(pressed ? null : fact.id)}
                className={`flex h-full min-h-16 w-full flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left ${
                  pressed ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border bg-card hover:bg-border/30"
                }`}
              >
                <span className="text-sm text-muted">{m.facts[fact.id]}</span>
                <span className="text-xl font-bold tabular-nums break-words">
                  <Changed value={fact.value} />
                </span>
                {fact.note && (
                  <span className="text-sm text-muted tabular-nums">
                    <Changed value={fact.note} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div id={panel} aria-live="polite">
        {opened && (
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <p className="mb-1 font-semibold">{m.facts[opened.id]}</p>
            {typeof opened.from === "string" ? <p className="text-muted">{opened.from}</p> : opened.from}
          </div>
        )}
      </div>
    </section>
  );
}
