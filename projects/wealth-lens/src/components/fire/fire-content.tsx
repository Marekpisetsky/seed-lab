"use client";

import { useMemo, useState } from "react";
import { CountryGoalCard } from "@/components/plan/country-goal";
import { Card } from "@/components/ui/card";
import { Disclosure } from "@/components/ui/disclosure";
import { Field, inputClass, PercentInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { usePlanView, useToday } from "@/hooks/use-plan";
import { updatePlan } from "@/lib/app-store";
import { costOfLiving } from "@/lib/cost-of-living";
import { coverageByCountry, requirementsByCountry } from "@/lib/fire";
import { formatMoney, formatRate } from "@/lib/format";
import { featuredCountries } from "@/lib/plan";
import { BASE_CURRENCY } from "@/lib/types";
import { CoverageList, DatasetSources, RequirementList } from "./country-list";
import { SuccessCard } from "./success-card";

const VIEWS = [
  { id: "needed", label: "What I need" },
  { id: "today", label: "What I have" },
] as const;

type View = (typeof VIEWS)[number]["id"];

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

export function FireContent() {
  const { plan } = useAppState();
  const planView = usePlanView();
  const today = useToday();
  const [view, setView] = useState<View>("needed");

  const capital = planView.capital.amount;
  const realReturn = planView.assumptions.realReturn;
  const { withdrawalRate, monthlyContribution, housing, homeCountry, goalCountry } = plan;
  const setWithdrawalRate = (rate: number) => updatePlan({ withdrawalRate: rate });
  const selectCountry = (code: string) => updatePlan({ goalCountry: code });

  const requirements = useMemo(
    () =>
      requirementsByCountry(costOfLiving.countries, { capital, withdrawalRate, realReturn, monthlyContribution, housing }),
    [capital, withdrawalRate, realReturn, monthlyContribution, housing],
  );
  const coverage = useMemo(
    () => coverageByCountry(costOfLiving.countries, capital, withdrawalRate, housing),
    [capital, withdrawalRate, housing],
  );
  const selectable = { homeCode: homeCountry, goalCode: goalCountry, onSelect: selectCountry };

  return (
    <div className="space-y-6">
      <CountryGoalCard view={planView} euroGoal={plan.goal.amount} />

      <SuccessCard
        withdrawalRate={withdrawalRate}
        onWithdrawalRateChange={setWithdrawalRate}
        investment={planView.investment}
        goal={{ amount: planView.goal.amount, monthlyIncome: planView.income.atGoal }}
      />

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
                {eur(monthlyContribution)}/month, growing {formatRate(realReturn)} after inflation.{" "}
                <strong className="font-medium text-foreground">Tap a country to make it your goal.</strong>
              </p>
              <RequirementList rows={featuredCountries(requirements, homeCountry)} today={today} {...selectable} />
              <Disclosure summary={`Show all ${requirements.length} countries`}>
                <RequirementList rows={requirements} today={today} {...selectable} />
              </Disclosure>
            </>
          ) : (
            <>
              <div>
                <p className="text-4xl font-semibold tracking-tight tabular-nums">
                  ≈ {eur(coverage.monthlyIncome)}
                  <span className="text-base font-normal text-muted">/month</span>
                </p>
                <p className="text-sm text-muted">
                  What {eur(capital)} pays at {formatRate(withdrawalRate)} a year. Enough for {coverage.coveredCount} of{" "}
                  {coverage.rows.length} countries. Tap one to make it your goal.
                </p>
              </div>
              <CoverageList rows={featuredCountries(coverage.rows, homeCountry)} {...selectable} />
              <Disclosure summary={`Show all ${coverage.rows.length} countries`}>
                <CoverageList rows={coverage.rows} {...selectable} />
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
                value={homeCountry}
                onChange={(event) => updatePlan({ homeCountry: event.target.value })}
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
                value={housing}
                onChange={(event) => updatePlan({ housing: event.target.value === "own" ? "own" : "rent" })}
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
