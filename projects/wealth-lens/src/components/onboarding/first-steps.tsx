"use client";

import { LoadDataButton } from "@/components/data-controls";
import { CsvImport } from "@/components/portfolio/csv-import";
import { Card } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app";
import { setHoldings, updatePlan } from "@/lib/app-store";
import { createId } from "@/lib/id";
import { mergeImportedHoldings } from "@/lib/import";
import { PlanForm } from "./plan-form";

/**
 * First use, and after every reload (nothing is saved): three questions on
 * one screen. With the answers every tab already shows results; holdings can
 * be added later, or everything loaded back from a downloaded file.
 */
export function FirstSteps() {
  const { holdings } = useAppState();

  return (
    <Card className="mx-auto max-w-lg">
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Start with 3 numbers</h2>
          <p className="text-sm text-muted">Nothing is saved: you can download your data at any time.</p>
        </div>
        <PlanForm
          initial={{ invested: "", monthly: "", goal: "" }}
          submitLabel="See my results"
          holdingsValue={null}
          onSubmit={({ invested, monthly, goal: amount }) =>
            updatePlan((plan) => ({ invested, monthlyContribution: monthly, goal: { ...plan.goal, amount } }))
          }
        />
        <div className="space-y-4 border-t border-border pt-4">
          <div>
            <p className="mb-2 text-sm text-muted">Already on Trading 212?</p>
            <CsvImport
              label="Import from Trading 212"
              hasHoldings={holdings.length > 0}
              onImport={(positions) => setHoldings((previous) => mergeImportedHoldings(previous, positions, createId))}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">Downloaded your data before?</p>
            <LoadDataButton />
          </div>
        </div>
      </div>
    </Card>
  );
}
