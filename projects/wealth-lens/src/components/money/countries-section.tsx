"use client";

import { Check, Plus, X } from "lucide-react";
import { Fragment, useState } from "react";
import { Changed } from "@/components/ui/changed";
import { addGoal } from "@/lib/app-store";
import { featuredRows, formatSmallEur, whenText, type CountryCell, type CountryRow } from "@/lib/calculator";
import { costOfLiving } from "@/lib/cost-of-living";
import { formatEur } from "@/lib/format";

function Cell({ cell }: { cell: CountryCell }) {
  return (
    <td className="px-1.5 py-2 align-top tabular-nums">
      <span className="block">{formatEur(cell.amount)}</span>
      <span className="block whitespace-nowrap text-xs">
        {cell.covered ? (
          <span className="font-medium text-positive">
            <Check aria-hidden="true" className="inline size-4 align-[-3px]" />
            <span className="sr-only">covered</span>
          </span>
        ) : (
          <Changed value={whenText(cell.months)} className="text-muted" />
        )}
      </span>
    </td>
  );
}

/** Below a row: add living there to My goals, without or with housing, as the user says. */
function AddRow({ row, onClose }: { row: CountryRow; onClose: () => void }) {
  const [added, setAdded] = useState<string | null>(null);
  const add = (housing: boolean) => {
    addGoal({ kind: "live", country: row.code, housing });
    setAdded(housing ? "with housing" : "without housing");
  };
  return (
    <tr>
      <td colSpan={4} className="px-2 pb-3">
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-background p-2 text-sm">
          {added ? (
            <span className="flex-1 font-medium text-positive">
              <Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />
              Added to My goals: live in {row.name}, {added}
            </span>
          ) : (
            <>
              <span className="w-full text-xs text-muted">Add living in {row.name} to My goals:</span>
              <button type="button" onClick={() => add(false)} className="rounded-md border border-border bg-card px-2 py-1 font-medium hover:border-accent">
                <Plus aria-hidden="true" className="mr-0.5 inline size-3.5 align-[-2px]" />
                Without housing
              </button>
              <button type="button" onClick={() => add(true)} className="rounded-md border border-border bg-card px-2 py-1 font-medium hover:border-accent">
                <Plus aria-hidden="true" className="mr-0.5 inline size-3.5 align-[-2px]" />
                With housing
              </button>
            </>
          )}
          <button type="button" aria-label="Close" onClick={onClose} className="ml-auto flex size-7 items-center justify-center rounded-md text-muted hover:bg-border/40">
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * "What €Y/month covers": every country of the list, cheapest first, with
 * the monthly cost for one person without and with housing side by side.
 * Each cell says ✓ when the income after the chosen years pays it, or when
 * the plan gets there. Seven rows until "Show all 30".
 */
export function CountriesSection({ income, rows }: { income: number; rows: readonly CountryRow[] }) {
  const [all, setAll] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const shown = all ? rows : featuredRows(rows);
  return (
    <section aria-labelledby="countries-title" className="space-y-2">
      <h2 id="countries-title" className="text-base font-semibold">
        What <Changed value={`${formatSmallEur(income)}/month`} /> covers
      </h2>
      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th scope="col" className="px-2 py-2 font-medium">
                A month
              </th>
              <th scope="col" className="px-1.5 py-2 font-medium">
                Without housing
              </th>
              <th scope="col" className="px-1.5 py-2 font-medium">
                With housing
              </th>
              <th scope="col" className="w-9 px-1 py-2">
                <span className="sr-only">Add to My goals</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((row) => (
              <Fragment key={row.code}>
                <tr>
                  <th scope="row" className="px-2 py-2 align-top font-medium">
                    {row.label}
                  </th>
                  <Cell cell={row.withoutHousing} />
                  <Cell cell={row.withHousing} />
                  <td className="px-1 py-1.5 align-top">
                    <button
                      type="button"
                      aria-label={`Add living in ${row.name} to My goals`}
                      aria-expanded={adding === row.code}
                      onClick={() => setAdding(adding === row.code ? null : row.code)}
                      className="flex size-8 items-center justify-center rounded-md text-accent hover:bg-accent/10"
                    >
                      <Plus aria-hidden="true" className="size-4" />
                    </button>
                  </td>
                </tr>
                {adding === row.code && <AddRow key={`${row.code}-add`} row={row} onClose={() => setAdding(null)} />}
              </Fragment>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          onClick={() => setAll(!all)}
          aria-expanded={all}
          className="w-full border-t border-border px-3 py-2 text-sm font-medium text-accent hover:bg-accent/5"
        >
          {all ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      </div>
      <p className="text-xs text-muted">
        Estimates for one person ({costOfLiving.compiledOn.slice(0, 7)}): Numbeo living costs; with housing adds renting a 1-bedroom
        outside the city centre (Wise). Country averages hide big differences between cities. ✓: paid by{" "}
        {formatSmallEur(income)}/month; otherwise, when this plan gets there.
      </p>
    </section>
  );
}
