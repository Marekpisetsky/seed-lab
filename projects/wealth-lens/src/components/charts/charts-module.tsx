"use client";

import Link from "next/link";
import { ModuleSkeleton } from "@/components/module-skeleton";
import { FirstSteps } from "@/components/onboarding/first-steps";
import { Card } from "@/components/ui/card";
import { useHydrated, usePersistentStore } from "@/hooks/use-persistent-store";
import { hasStarted } from "@/lib/plan";
import { holdingsStore, investedStore } from "@/lib/stores";
import { HoldingChartRow } from "./holding-chart-card";

export function ChartsModule() {
  const hydrated = useHydrated();
  const [holdings] = usePersistentStore(holdingsStore);
  const [invested] = usePersistentStore(investedStore);
  if (!hydrated) return <ModuleSkeleton />;
  if (!hasStarted(holdings, invested)) return <FirstSteps />;
  return <ChartsContent />;
}

function ChartsContent() {
  const [holdings] = usePersistentStore(holdingsStore);

  if (holdings.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          Charts need your holdings.{" "}
          <Link href="/" className="font-medium text-accent underline-offset-2 hover:underline">
            Add them on Portfolio & goal
          </Link>
          .
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-1 text-sm text-muted">Last 12 months. Tap a stock for its full chart.</p>
      <ul className="divide-y divide-border">
        {holdings.map((holding) => (
          <HoldingChartRow key={holding.id} holding={holding} />
        ))}
      </ul>
    </Card>
  );
}
