"use client";

import { Check } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { SettledNumberInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import type { I18n } from "@/i18n";
import { growthSource } from "@/i18n/investment-text";
import { quotedGrowth, realismWarning, strongGrowthWarning } from "@/lib/assumptions";
import { EXAMPLE_IDS, exampleOf, exampleRates, fieldPercent, pickExample, sameTenth, setGrowth } from "@/lib/examples";
import type { ResolvedInvestment } from "@/lib/investment";
import type { Plan } from "@/lib/types";
import { GROWTH_LIMITS, STARTING_GROWTH } from "@/lib/validation";

/**
 * The line under the field: a warning in its place when the growth is
 * beyond the best 20 years in the data, and a stronger one, in euros and
 * with no lines cut, over 50 % a year.
 */
function lineFor(current: ResolvedInvestment, plan: Plan, i18n: I18n): { text: string; warning: false | "rare" | "strong" } {
  const strong = strongGrowthWarning(current.realReturn, { years: plan.years, invested: plan.invested ?? 0, monthly: plan.monthlyContribution ?? 0 }, i18n);
  if (strong) return { text: strong, warning: "strong" };
  const warning = realismWarning(current, i18n);
  if (warning) return { text: warning, warning: "rare" };
  const t = i18n.m.growth;
  if (current.investment.kind === "custom") return { text: sameTenth(current.realReturn, STARTING_GROWTH) ? t.standard : t.yours, warning: false };
  const source = growthSource(current, i18n);
  return { text: source.charAt(0).toUpperCase() + source.slice(1), warning: false };
}

/**
 * Step 3's field: the growth a year after rising prices, 5 to start; under
 * it one line on what the number is ("Long-run world average, after
 * inflation"), the same before rising prices, small, and examples to fill
 * it with one tap, the one it matches marked. Every part
 * keeps its height, whatever the language or the number.
 */
export function GrowthField({ id, current, compact, onEnter }: { id: string; current: ResolvedInvestment; compact: boolean; onEnter: () => void }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.growth;
  const { plan } = useAppState();
  const { pricesOf, assumptions } = plan;
  const rates = useMemo(() => exampleRates({ pricesOf, assumptions }), [pricesOf, assumptions]);
  const picked = current.custom ? null : exampleOf(plan.investment);
  const line = lineFor(current, plan, i18n);
  const before = `${id}-before`;
  const about = `${id}-about`;
  return (
    <div className="space-y-1">
      <span className="relative block">
        <SettledNumberInput
          id={id}
          aria-describedby={`${about} ${before}`}
          enterKeyHint="next"
          value={fieldPercent(current.realReturn)}
          min={GROWTH_LIMITS.min * 100}
          max={GROWTH_LIMITS.max * 100}
          onCommit={(percent) => setGrowth(percent / 100, current.realReturn, rates, plan.investment)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            onEnter();
          }}
          className="pr-12"
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
          {t.unit}
        </span>
      </span>
      {/* What the number is: two lines kept on a phone and beside a result, one on a wide screen, so nothing moves; over 50 % a year, the whole warning. */}
      <p
        id={about}
        className={`text-sm ${
          line.warning === "strong"
            ? "rounded-md border border-warning-border bg-warning-bg px-2 py-1.5 font-medium text-warning-foreground"
            : `${compact ? "line-clamp-2 h-10" : "line-clamp-2 h-10 lg:line-clamp-1 lg:h-5"} ${line.warning ? "font-medium text-warning-foreground" : "text-muted"}`
        }`}
      >
        <Changed value={line.text} />
      </p>
      <p id={before} className="h-5 truncate text-sm text-muted tabular-nums">
        <Changed value={t.before(f.rate(quotedGrowth(current)))} />
      </p>
      <div role="group" aria-labelledby={`${id}-examples`}>
        <p id={`${id}-examples`} className="h-5 text-sm text-muted">
          {t.examplesLabel}
        </p>
        {/* Three across on a phone, one row on a wide screen: rows of fixed height either way. */}
        <div className={`grid grid-cols-3 ${compact ? "" : "lg:flex lg:justify-between"}`}>
          {EXAMPLE_IDS.map((example) => {
            const pressed = example === picked;
            const name = t.examples[example];
            const rate = f.rate(rates[example]);
            return (
              <button
                key={example}
                type="button"
                aria-pressed={pressed}
                aria-label={t.example(name, rate)}
                onClick={() => pickExample(example)}
                className="flex min-h-11 min-w-11 flex-col items-start justify-center rounded-md px-1 text-left leading-tight hover:bg-border/40"
              >
                <span className={`flex items-center gap-0.5 whitespace-nowrap text-base ${pressed ? "font-semibold text-foreground" : "text-accent underline underline-offset-2"}`}>
                  {name}
                  {pressed && <Check aria-hidden="true" className="size-3.5" />}
                </span>
                <span className="text-sm text-muted tabular-nums">{rate}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
