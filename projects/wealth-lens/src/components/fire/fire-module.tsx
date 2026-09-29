"use client";

import { useMemo, useState } from "react";
import { ModuleSkeleton } from "@/components/module-skeleton";
import { Card } from "@/components/ui/card";
import { useHydrated, usePersistentStore } from "@/hooks/use-persistent-store";
import { costOfLiving } from "@/lib/cost-of-living";
import { startOfUtcDay } from "@/lib/dates";
import { summarizeByCurrency } from "@/lib/finance";
import { coverageByCountry, requirementsByCountry } from "@/lib/fire";
import { assumptionsStore, fireSettingsStore, holdingsStore } from "@/lib/stores";
import { BASE_CURRENCY } from "@/lib/types";
import { CoverageView } from "./coverage-view";
import { FireInputs } from "./fire-inputs";
import { RequirementsView } from "./requirements-view";

const VIEWS = [
  { id: "coverage", label: "With my current capital" },
  { id: "needed", label: "How much I need" },
] as const;

type View = (typeof VIEWS)[number]["id"];

export function FireModule() {
  const hydrated = useHydrated();
  if (!hydrated) return <ModuleSkeleton />;
  return <FireContent />;
}

function FireContent() {
  const [holdings] = usePersistentStore(holdingsStore);
  const [assumptions, setAssumptions] = usePersistentStore(assumptionsStore);
  const [settings, setSettings] = usePersistentStore(fireSettingsStore);
  const [view, setView] = useState<View>("coverage");
  const today = useMemo(() => startOfUtcDay(new Date()), []);

  const portfolioCapital = useMemo(
    () => summarizeByCurrency(holdings).find((summary) => summary.currency === BASE_CURRENCY)?.value ?? 0,
    [holdings],
  );
  const capital = settings.capitalOverride ?? portfolioCapital;
  const housingLabel = settings.housing === "rent" ? "renting" : "no rent";

  const coverage = useMemo(
    () => coverageByCountry(costOfLiving.countries, capital, assumptions.withdrawalRate, settings.housing),
    [capital, assumptions.withdrawalRate, settings.housing],
  );
  const requirements = useMemo(
    () =>
      requirementsByCountry(costOfLiving.countries, {
        capital,
        withdrawalRate: assumptions.withdrawalRate,
        realReturn: assumptions.realReturn,
        monthlyContribution: assumptions.monthlyContribution,
        housing: settings.housing,
      }),
    [capital, assumptions, settings.housing],
  );

  const updateAssumptions = (patch: Partial<typeof assumptions>) =>
    setAssumptions((previous) => ({ ...previous, ...patch }));

  return (
    <div className="space-y-6">
      <FireInputs
        capital={capital}
        portfolioCapital={portfolioCapital}
        settings={settings}
        withdrawalRate={assumptions.withdrawalRate}
        onSettingsChange={(patch) => setSettings((previous) => ({ ...previous, ...patch }))}
        onWithdrawalRateChange={(withdrawalRate) => updateAssumptions({ withdrawalRate })}
      />

      <Card>
        <div role="tablist" aria-label="Simulator view" className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-background p-1">
          {VIEWS.map(({ id, label }) => (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={view === id}
              aria-controls={`panel-${id}`}
              onClick={() => setView(id)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                view === id ? "bg-card shadow-sm ring-1 ring-border" : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`}>
          {view === "coverage" ? (
            <CoverageView
              capital={capital}
              withdrawalRate={assumptions.withdrawalRate}
              housingLabel={housingLabel}
              result={coverage}
            />
          ) : (
            <RequirementsView
              capital={capital}
              assumptions={assumptions}
              rows={requirements}
              housingLabel={housingLabel}
              today={today}
              onAssumptionsChange={updateAssumptions}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
