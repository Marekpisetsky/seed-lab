"use client";

import { RotateCcw } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { SettledNumberInput } from "@/components/ui/form";
import { RadioGroup } from "@/components/ui/radio-group";
import { resetAssumptions, setAssumptions, setPricesOf } from "@/lib/app-store";
import { assumptionsLine, assumptionsNote, growthIn, upsAndDownsExample, type Basis } from "@/lib/assumptions";
import { costOfLiving, referenceInflation } from "@/lib/cost-of-living";
import { byCountryName, countryName } from "@/i18n/countries";
import { COMMON_PERIOD } from "@/lib/indexes";
import { toNominal, type ResolvedInvestment } from "@/lib/investment";
import type { AssumptionOverrides } from "@/lib/types";
import { MAX_VOLATILITY } from "@/lib/validation";
import { HowTheSimulationsWork } from "./explainers";

const labelClass = "block text-xs font-medium text-muted";
/** Percent with at most two decimals, as a field shows it. */
const asPercent = (fraction: number) => Number((fraction * 100).toFixed(2));
/** A typed figure that is the standard one, to the hundredth of a percent, is not a change. */
const same = (a: number, b: number) => Math.abs(a - b) < 0.00005;

function PercentField({
  label,
  prefix,
  value,
  min,
  max,
  onCommit,
  hint,
}: {
  label: string;
  /** Shown before the figure, e.g. "±". */
  prefix?: string;
  value: number;
  min: number;
  max: number;
  onCommit: (fraction: number) => void;
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <span className="relative block">
        <SettledNumberInput
          id={id}
          value={asPercent(value)}
          min={min * 100}
          max={max * 100}
          onCommit={(percent) => onCommit(percent / 100)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`pr-7 text-base ${prefix ? "pl-7" : ""}`}
        />
        {prefix && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            {prefix}
          </span>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
          %
        </span>
      </span>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * The assumptions under the calculator, in plain words: one compact line,
 * filled in with the standard figures of what the money is in, and an
 * "Edit" panel where how much it grows (after or before rising prices), how
 * much it can go up or down and how fast prices rise can be changed. A
 * changed figure marks the line "Custom"; "Reset to standard" brings the
 * standard ones back.
 */
export function AssumptionsPanel({
  investment,
  assumptions,
  basis,
  onBasis,
  open,
  onOpen,
}: {
  investment: ResolvedInvestment;
  assumptions: AssumptionOverrides;
  basis: Basis;
  onBasis: (basis: Basis) => void;
  open: boolean;
  onOpen: (open: boolean) => void;
}) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.assumptions;
  const panelId = useId();
  const { standard, inflation } = investment;
  const reference = referenceInflation(investment.pricesOf);
  const changed = assumptions.growth !== null || assumptions.volatility !== null || assumptions.inflation !== null;
  const standardGrowth = basis === "real" ? standard.realReturn : toNominal(standard.realReturn, inflation);
  const isSavings = investment.investment.kind === "asset" && investment.investment.asset === "savings";
  const isCustomGrowth = investment.investment.kind === "custom";

  return (
    <div className="col-span-2 space-y-1 sm:col-span-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm tabular-nums">
          <Changed value={assumptionsLine(investment, basis, i18n)} />
        </p>
        {(investment.custom || investment.customInflation) && (
          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">{t.custom}</span>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpen(!open)}
          className="min-h-11 rounded-md px-3 py-1 text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          {open ? t.done : t.edit}
        </button>
      </div>
      <p className="text-xs text-muted">
        <Changed value={assumptionsNote(investment, i18n)} />
      </p>
      {open && (
        <div id={panelId} className="mt-2 space-y-3 rounded-lg bg-background p-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
            <div className="col-span-2 space-y-1">
              <PercentField
                label={t.growth}
                value={growthIn(investment, basis)}
                min={-0.5}
                max={0.5}
                onCommit={(rate) => setAssumptions({ growth: same(rate, standardGrowth) && !isCustomGrowth ? null : { rate, basis } })}
                hint={
                  isCustomGrowth
                    ? t.hintCustom
                    : isSavings
                      ? t.hintSavings(f.rate(standard.nominalRate ?? 0))
                      : basis === "real"
                        ? t.hintReal(f.rate(standardGrowth), `${COMMON_PERIOD[0]}–${COMMON_PERIOD[1]}`)
                        : t.hintNominal(f.rate(standardGrowth), f.rate(standard.realReturn), f.rate(inflation))
                }
              />
              <RadioGroup
                label={t.basis}
                options={[
                  { value: "real" as const, label: t.after },
                  { value: "nominal" as const, label: t.before },
                ]}
                value={basis}
                onChange={onBasis}
                className="inline-flex rounded-md border border-border p-0.5 text-xs"
                optionClassName={(checked) => `min-h-11 rounded px-3 py-1 font-medium ${checked ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
              />
              <p className="text-xs text-muted">{t.afterHelp}</p>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <PercentField
                label={t.upsAndDowns}
                prefix="±"
                value={investment.volatility}
                min={0}
                max={MAX_VOLATILITY}
                onCommit={(volatility) => setAssumptions({ volatility: same(volatility, standard.volatility) && !isCustomGrowth ? null : volatility })}
                hint={
                  <>
                    <Changed value={upsAndDownsExample(investment.volatility, i18n)} />{" "}
                    {isCustomGrowth
                      ? t.hintVolCustom(f.percent(standard.volatility, { decimals: 0 }))
                      : standard.volatility > 0
                        ? t.hintVol(f.percent(standard.volatility, { decimals: 1 }))
                        : t.hintVolNone}
                  </>
                }
              />
            </div>
            <label className="col-span-2 min-w-0 space-y-1">
              <span className={labelClass}>{t.risingIn}</span>
              <select
                value={investment.pricesOf}
                onChange={(event) => setPricesOf(event.target.value)}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              >
                {byCountryName(costOfLiving.countries, i18n).map((country) => (
                  <option key={country.code} value={country.code}>
                    {countryName(country.code, i18n)}
                  </option>
                ))}
              </select>
            </label>
            <div className="col-span-2">
              <PercentField
                label={t.pricesRise}
                value={inflation}
                min={-0.1}
                max={0.5}
                onCommit={(rate) => setAssumptions({ inflation: same(rate, reference.rate) ? null : rate })}
                hint={(/average/i.test(reference.basis) ? t.hintAverage : t.hintTarget)(f.rate(reference.rate), reference.asOf)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <HowTheSimulationsWork />
            {changed && (
              <button
                type="button"
                onClick={resetAssumptions}
                className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
              >
                <RotateCcw aria-hidden="true" className="size-4" /> {t.reset}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
