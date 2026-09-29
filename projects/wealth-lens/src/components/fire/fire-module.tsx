"use client";

import { useMemo, useState } from "react";
import { ModuleSkeleton } from "@/components/module-skeleton";
import { FirstSteps } from "@/components/onboarding/first-steps";
import { Card } from "@/components/ui/card";
import { Disclosure } from "@/components/ui/disclosure";
import { Field, inputClass, PercentInput } from "@/components/ui/form";
import { useHydrated, usePersistentStore } from "@/hooks/use-persistent-store";
import { usePricedHoldings } from "@/hooks/use-priced-holdings";
import { costOfLiving } from "@/lib/cost-of-living";
import { startOfUtcDay } from "@/lib/dates";
import { coverageByCountry, requirementsByCountry } from "@/lib/fire";
import { formatMoney, formatRate } from "@/lib/format";
import { featuredCountries, hasStarted, startingCapital } from "@/lib/plan";
import { assumptionsStore, fireSettingsStore, holdingsStore, investedStore } from "@/lib/stores";
import { BASE_CURRENCY } from "@/lib/types";
import { CoverageList, DatasetSources, RequirementList } from "./country-list";
import { SuccessCard } from "./success-card";

const VIEWS = [
  { id: "needed", label: "What I need" },
  { id: "today", label: "What I have" },
] as const;

type View = (typeof VIEWS)[number]["id"];

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

export function FireModule() {
  const hydrated = useHydrated();
  const [holdings] = usePersistentStore(holdingsStore);
  const [invested] = usePersistentStore(investedStore);
  if (!hydrated) return <ModuleSkeleton />;
  if (!hasStarted(holdings, invested)) return <FirstSteps />;
  return <FireContent />;
}

function FireContent() {
  const holdings = usePricedHoldings();
  const [invested] = usePersistentStore(investedStore);
  const [assumptions, setAssumptions] = usePersistentStore(assumptionsStore);
  const [settings, setSettings] = usePersistentStore(fireSettingsStore);
  const [view, setView] = useState<View>("needed");
  const today = useMemo(() => startOfUtcDay(new Date()), []);

  const capital = startingCapital(holdings, invested).amount;
  const { withdrawalRate, realReturn, monthlyContribution } = assumptions;
  const setWithdrawalRate = (rate: number) => setAssumptions((previous) => ({ ...previous, withdrawalRate: rate }));

  const requirements = useMemo(
    () =>
      requirementsByCountry(costOfLiving.countries, {
        capital,
        withdrawalRate,
        realReturn,
        monthlyContribution,
        housing: settings.housing,
      }),
    [capital, withdrawalRate, realReturn, monthlyContribution, settings.housing],
  );
  const coverage = useMemo(
    () => coverageByCountry(costOfLiving.countries, capital, withdrawalRate, settings.housing),
    [capital, withdrawalRate, settings.housing],
  );

  return (
    <div className="space-y-6">
      <SuccessCard withdrawalRate={withdrawalRate} onWithdrawalRateChange={setWithdrawalRate} />

      <Card>
        <div role="tablist" aria-label="View" className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-background p-1">
          {VIEWS.map(({ id, label }) => (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={view === id}
              aria-controls={`panel-${id}`}
              onClick={() => setView(id)}
              className={`rounded-md px-2 py-2 text-sm font-medium ${
                view === id ? "bg-card shadow-sm ring-1 ring-border" : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`} className="space-y-3">
          {view === "needed" ? (
            <>
              <p className="text-sm text-muted">
                Money needed to live off {formatRate(withdrawalRate)} a year. Starting from {eur(capital)} +{" "}
                {eur(monthlyContribution)}/month, growing {formatRate(realReturn)} after inflation.
              </p>
              <RequirementList rows={featuredCountries(requirements, settings.homeCountry)} homeCode={settings.homeCountry} today={today} />
              <Disclosure summary={`Show all ${requirements.length} countries`}>
                <RequirementList rows={requirements} homeCode={settings.homeCountry} today={today} />
              </Disclosure>
            </>
          ) : (
            <>
              <div>
                <p className="text-4xl font-semibold tracking-tight tabular-nums">
                  {eur(coverage.monthlyIncome)}
                  <span className="text-base font-normal text-muted"> a month</span>
                </p>
                <p className="text-sm text-muted">
                  {eur(capital)} × {formatRate(withdrawalRate)} a year. Enough for{" "}
                  {coverage.coveredCount} of {coverage.rows.length} countries.
                </p>
              </div>
              <CoverageList rows={featuredCountries(coverage.rows, settings.homeCountry)} homeCode={settings.homeCountry} />
              <Disclosure summary={`Show all ${coverage.rows.length} countries`}>
                <CoverageList rows={coverage.rows} homeCode={settings.homeCountry} />
              </Disclosure>
            </>
          )}
          <p className="text-xs text-muted">Living costs are estimates (Numbeo + Wise, Sep 2026), not live data.</p>
        </div>
      </Card>

      <Disclosure summary="Advanced">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Home country">
            {(props) => (
              <select
                {...props}
                value={settings.homeCountry}
                onChange={(event) => setSettings((previous) => ({ ...previous, homeCountry: event.target.value }))}
                className={inputClass}
              >
                {[...costOfLiving.countries]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
              </select>
            )}
          </Field>
          <Field label="Housing">
            {(props) => (
              <select
                {...props}
                value={settings.housing}
                onChange={(event) =>
                  setSettings((previous) => ({ ...previous, housing: event.target.value === "own" ? "own" : "rent" }))
                }
                className={inputClass}
              >
                <option value="rent">I pay rent</option>
                <option value="own">I own my home</option>
              </select>
            )}
          </Field>
          <Field label="Other withdrawal rate (%)">
            {(props) => (
              <PercentInput
                {...props}
                key={withdrawalRate}
                value={withdrawalRate}
                min={0.5}
                max={10}
                onCommit={(value) => value !== null && setWithdrawalRate(value)}
              />
            )}
          </Field>
        </div>
        <DatasetSources />
      </Disclosure>
    </div>
  );
}
