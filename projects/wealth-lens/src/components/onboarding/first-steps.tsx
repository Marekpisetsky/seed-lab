"use client";

import { CsvImport } from "@/components/portfolio/csv-import";
import { Card } from "@/components/ui/card";
import { usePersistentStore } from "@/hooks/use-persistent-store";
import { createId } from "@/lib/id";
import { mergeImportedHoldings } from "@/lib/import";
import { assumptionsStore, goalStore, holdingsStore, investedStore } from "@/lib/stores";
import { PlanForm } from "./plan-form";

/**
 * First use: three questions on one screen instead of empty pages. With the
 * answers every tab already shows results; holdings can be added later.
 */
export function FirstSteps() {
  const [, setInvested] = usePersistentStore(investedStore);
  const [, setAssumptions] = usePersistentStore(assumptionsStore);
  const [, setGoal] = usePersistentStore(goalStore);
  const [holdings, setHoldings] = usePersistentStore(holdingsStore);

  return (
    <Card className="mx-auto max-w-lg">
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Start with 3 numbers</h2>
          <p className="text-sm text-muted">You can add your stocks one by one later.</p>
        </div>
        <PlanForm
          initial={{ invested: "", monthly: "", goal: "" }}
          submitLabel="See my results"
          holdingsValue={null}
          onSubmit={({ invested, monthly, goal: amount }) => {
            setAssumptions((previous) => ({ ...previous, monthlyContribution: monthly }));
            setGoal((previous) => ({ ...previous, amount }));
            setInvested(invested);
          }}
        />
        <div className="border-t border-border pt-4">
          <p className="mb-2 text-sm text-muted">Already on Trading 212?</p>
          <CsvImport
            label="Import from Trading 212"
            hasHoldings={holdings.length > 0}
            onImport={(positions) => setHoldings((previous) => mergeImportedHoldings(previous, positions, createId))}
          />
        </div>
      </div>
    </Card>
  );
}
