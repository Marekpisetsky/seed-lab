"use client";

import { Check, Plus, Search, X } from "lucide-react";
import { Fragment, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { inputClass } from "@/components/ui/form";
import { Help } from "@/components/ui/help";
import { countryInSentence, countryName, matchesCountry } from "@/i18n/countries";
import { addGoal } from "@/lib/app-store";
import { featuredRows, type CountryCell, type CountryRow } from "@/lib/calculator";
import { costOfLiving } from "@/lib/cost-of-living";

function Cell({ cell }: { cell: CountryCell }) {
  const { m, f } = useI18n();
  return (
    <td className="px-1.5 py-2 align-top tabular-nums">
      <span className="block">{f.eur(cell.amount)}</span>
      <span className="block whitespace-nowrap text-xs">
        {cell.covered ? (
          <span className="font-medium text-positive">
            <Check aria-hidden="true" className="inline size-4 align-[-3px]" />
            <span className="sr-only">{m.countryTable.covered}</span>
          </span>
        ) : (
          <Changed value={f.when(cell.months)} className="text-muted" />
        )}
      </span>
    </td>
  );
}

/** Below a row: add living there to My goals, without or with housing, as the user says. */
function AddRow({ row, onClose }: { row: CountryRow; onClose: () => void }) {
  const i18n = useI18n();
  const t = i18n.m.countryTable;
  const [added, setAdded] = useState<boolean | null>(null);
  const name = countryInSentence(row.code, i18n);
  const add = (housing: boolean) => {
    addGoal({ kind: "live", country: row.code, housing });
    setAdded(housing);
  };
  return (
    <tr>
      <td colSpan={4} className="px-2 pb-3">
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-background p-2 text-sm">
          {added !== null ? (
            <span className="flex-1 font-medium text-positive">
              <Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />
              {t.added(name, added)}
            </span>
          ) : (
            <>
              <span className="w-full text-xs text-muted">{t.addPrompt(name)}</span>
              {[false, true].map((housing) => (
                <button
                  key={String(housing)}
                  type="button"
                  onClick={() => add(housing)}
                  className="min-h-11 rounded-md border border-border bg-card px-3 py-1 font-medium hover:border-accent"
                >
                  <Plus aria-hidden="true" className="mr-0.5 inline size-3.5 align-[-2px]" />
                  {housing ? t.optionWith : t.optionWithout}
                </button>
              ))}
            </>
          )}
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
export function CountriesSection({ income, rows }: { income: number; rows: readonly CountryRow[] }) {
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
      <h2 id="countries-title" className="flex items-center gap-2 text-base font-semibold">
        <Changed value={t.title(paid)} />
        <Help what={t.title(paid)} text={m.help.countries} />
      </h2>
      <label className="relative block">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t.search} placeholder={t.search} className={`${inputClass} pl-9 text-base`} />
      </label>
      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
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
                  </th>
                  <Cell cell={row.withoutHousing} />
                  <Cell cell={row.withHousing} />
                  <td className="px-1 py-1.5 align-top">
                    <button
                      type="button"
                      aria-label={t.add(countryInSentence(row.code, i18n))}
                      aria-expanded={adding === row.code}
                      onClick={() => setAdding(adding === row.code ? null : row.code)}
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
            className="min-h-11 w-full border-t border-border px-3 py-2 text-sm font-medium text-accent hover:bg-accent/5"
          >
            {all ? t.showFewer : t.showAll(rows.length)}
          </button>
        )}
      </div>
      <p className="text-xs text-muted">
        {t.note(costOfLiving.compiledOn.slice(0, 7))} {t.paidBy(i18n.f.smallEur(income))}
      </p>
    </section>
  );
}
