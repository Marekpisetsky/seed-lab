"use client";

import Link from "next/link";
import { ModuleSkeleton } from "@/components/module-skeleton";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { useHydrated, usePersistentStore } from "@/hooks/use-persistent-store";
import { holdingsStore } from "@/lib/stores";
import { HoldingChartCard } from "./holding-chart-card";

export function ChartsModule() {
  const hydrated = useHydrated();
  if (!hydrated) return <ModuleSkeleton />;
  return <ChartsContent />;
}

function ChartsContent() {
  const [holdings] = usePersistentStore(holdingsStore);

  if (holdings.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          No holdings yet.{" "}
          <Link href="/" className="font-medium text-accent underline-offset-2 hover:underline">
            Add or import your holdings
          </Link>{" "}
          to get one chart per stock.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Notice>
        Prices come from <strong>Stooq</strong>, a free, unofficial third-party source fetched through this
        app&apos;s server. It can be delayed, change format or stop answering; each chart then tells you why and
        lets you upload your own CSV instead. Drag to pan, scroll or pinch to zoom. Prices are in the currency of
        the exchange (e.g. USD for .us, pence for .uk).
      </Notice>
      {holdings.map((holding) => (
        <HoldingChartCard key={holding.id} holding={holding} />
      ))}
    </div>
  );
}
