"use client";

import { LoadDataButton } from "@/components/data-controls";
import { CsvImport } from "@/components/portfolio/csv-import";
import { useAppState } from "@/hooks/use-app";
import { setHoldings } from "@/lib/app-store";
import { createId } from "@/lib/id";
import { mergeImportedHoldings } from "@/lib/import/merge";

/** Before any number: the question the page answers. */
export function Welcome() {
  return (
    <section aria-label="Answer" className="space-y-2">
      <p className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">What does your money mean?</p>
      <p className="text-muted">Two numbers: what it pays, when, and where.</p>
    </section>
  );
}

/** Other ways to start: a broker export, or a file downloaded before. */
export function StartOptions() {
  const { holdings } = useAppState();
  return (
    <section aria-label="Other ways to start" className="space-y-4 text-sm">
      <div className="space-y-2">
        <p className="text-muted">On Trading 212?</p>
        <CsvImport
          label="Import from Trading 212"
          hasHoldings={holdings.length > 0}
          onImport={(positions) => setHoldings((previous) => mergeImportedHoldings(previous, positions, createId))}
        />
      </div>
      <div className="space-y-2">
        <p className="text-muted">Downloaded your data before?</p>
        <LoadDataButton />
      </div>
    </section>
  );
}
