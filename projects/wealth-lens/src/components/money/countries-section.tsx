"use client";

import { Check, Plus, Search, X } from "lucide-react";
import { Fragment, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { inputClass } from "@/components/ui/form";
import { countryInSentence, countryName, matchesCountry } from "@/i18n/countries";
import { addGoal } from "@/lib/app-store";
import { featuredRows, type CountryCell, type CountryRow } from "@/lib/calculator";
import { costOfLiving } from "@/lib/cost-of-living";

/** The year of the price levels behind most estimates. */
const ESTIMATES_YEAR = Math.max(...costOfLiving.countries.map((country) => country.priceLevel?.year ?? 0));

/** The plan's years and today, to say when each cell is reached. */
interface When {
  horizonMonths: number;
  today: Date;
}

/**
 * A cost and when it is paid, always with a date: ✓ "from 2031, in 5
 * years" when the plan pays it within its years (even well before their
 * end), "in 25 years (2051)" after them, "not at this pace" past 60 years.
 */
function Cell({ cell, when }: { cell: CountryCell; when: When }) {
  const { m, f } = useI18n();
  // Paid at the end of the plan's years is paid since the month it was first reached.
  const reach = f.reach(cell.months, when.horizonMonths, when.today);
  return (
    <td className="px-1.5 py-2 align-top tabular-nums">
      <span className="block">{f.eur(cell.amount)}</span>
      {/* Two short lines, so a narrow cell does not break them anywhere: "✓ from 2031" / "in 5 years". */}
      <span className={`block text-sm ${cell.covered ? "font-medium text-positive" : "text-muted"}`}>
        <span className="block">
          {cell.covered && <Check aria-hidden="true" className="mr-0.5 inline size-4 align-[-3px]" />}
          {cell.covered && <span className="sr-only">{m.countryTable.covered} </span>}
          <Changed value={reach.lines[0]} />
        </span>
        {reach.lines[1] && (
          <span className="block">
            <Changed value={reach.lines[1]} />
          </span>
        )}
      </span>
    </td>
  );
}

/** Below a row: add living there to My goals, without or with housing, as the user says. */
function AddRow({ row, onClose }: { row: CountryRow; onClose: () => void }) {
  const i18n = useI18n();
  const t = i18n.m.countryTable;
  const name = countryInSentence(row.code, i18n);
  return (
    <tr>
      <td colSpan={4} className="px-2 pb-3">
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-background p-2 text-sm">
            <span role="status" className="flex-1 font-medium text-positive">
              <Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />
              {t.added(name, true)}
            </span>
          <button type="button" aria-label={t.close} onClick={onClose} className="ml-auto flex size-11 items-center justify-center rounded-md text-muted hover:bg-border/40">
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
 * the plan gets there. Seven rows until "Show all"; a search finds any.
 */
export function CountriesSection({ income, rows, horizonMonths, today }: { income: number; rows: readonly CountryRow[] } & When) {
  const when = { horizonMonths, today };
  const i18n = useI18n();
  const { m } = i18n;
  const t = m.countryTable;
  const [all, setAll] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const searching = query.trim() !== "";
  const shown = searching ? rows.filter((row) => matchesCountry(row.code, query, i18n)) : all ? rows : featuredRows(rows);
  const paid = m.result.perMonth(i18n.f.smallEur(income));
  return (
    <section aria-labelledby="countries-title" className="space-y-2">
      <h3 id="countries-title" className="text-base font-bold">
        <Changed value={t.title(paid)} />
      </h3>
      <p className="text-sm text-muted">{t.paidBy(i18n.f.smallEur(income))}</p>
      <label className="relative block">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t.search} placeholder={t.search} className={`${inputClass} pl-9 text-base`} />
      </label>
      <div role="region" aria-label={t.comparison} tabIndex={0} className="relative overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="text-sm text-muted">
            <tr className="border-b border-border">
              <th scope="col" className="px-2 py-2 font-medium">
                {t.month}
              </th>
              <th scope="col" className="px-1.5 py-2 font-medium">
                {t.without}
              </th>
              <th scope="col" className="px-1.5 py-2 font-medium">
                {t.with}
              </th>
              <th scope="col" className="w-12 px-1 py-2">
                <span className="sr-only">{t.addTitle}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((row) => (
              <Fragment key={row.code}>
                <tr>
                  <th scope="row" className="px-2 py-2 align-top font-medium">
                    {countryName(row.code, i18n)}
                    {row.estimated && (
                      <>
                        <span aria-hidden="true" className="ml-1 font-normal text-muted">
                          ≈
                        </span>
                        <span className="sr-only">, {t.estimated}</span>
                      </>
                    )}
                  </th>
                  <Cell cell={row.withoutHousing} when={when} />
                  <Cell cell={row.withHousing} when={when} />
                  <td className="px-1 py-1.5 align-top">
                    <button
                      type="button"
                      aria-label={t.add(countryInSentence(row.code, i18n))}
                      aria-expanded={adding === row.code}
                      onClick={() => {
                        if (adding === row.code) { setAdding(null); return; }
                        addGoal({ kind: "live", country: row.code, housing: true });
                        setAdding(row.code);
                      }}
                      className="flex size-11 items-center justify-center rounded-md text-accent hover:bg-accent/10"
                    >
                      <Plus aria-hidden="true" className="size-4" />
                    </button>
                  </td>
                </tr>
                {adding === row.code && <AddRow key={`${row.code}-add`} row={row} onClose={() => setAdding(null)} />}
              </Fragment>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-3 text-sm text-muted">
                  {t.noMatch(query)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!searching && (
          <button
            type="button"
            onClick={() => setAll(!all)}
            aria-expanded={all}
            className="min-h-11 w-full border-t border-border px-3 py-2 text-base font-medium text-accent hover:bg-accent/5"
          >
            {all ? t.showFewer : t.showAll(rows.length)}
          </button>
        )}
      </div>
      <p className="text-sm text-muted">
        {t.note(costOfLiving.compiledOn.slice(0, 7))}
      </p>
      {shown.some((row) => row.estimated) && <p className="text-sm text-muted">{t.estimatedNote(ESTIMATES_YEAR)}</p>}
    </section>
  );
}
