import { costOfLiving, type CountryCost } from "@/lib/cost-of-living";
import { addMonths } from "@/lib/dates";
import type { CoverageRow, RequirementRow } from "@/lib/fire";
import { formatApproxDuration, formatMoney } from "@/lib/format";
import { BASE_CURRENCY } from "@/lib/types";

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

function CountryName({ country, monthlyCost, home }: { country: CountryCost; monthlyCost: number; home: boolean }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="font-medium">
        {country.name}
        {home && <span className="ml-2 rounded bg-border/60 px-1.5 py-0.5 text-xs font-normal text-muted">home</span>}
      </p>
      <p className="text-xs text-muted tabular-nums">{eur(monthlyCost)} a month</p>
    </div>
  );
}

/** Capital needed per country and when you get there. */
export function RequirementList({ rows, homeCode, today }: { rows: RequirementRow[]; homeCode: string; today: Date }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.country.code} className="flex items-center gap-3 py-3">
          <CountryName country={row.country} monthlyCost={row.monthlyCost} home={row.country.code === homeCode} />
          <div className="text-right">
            <p className="font-semibold tabular-nums">{eur(row.requiredCapital)}</p>
            <p className="text-xs text-muted">{whenReached(row.monthsToReach, today)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function whenReached(months: number, today: Date): string {
  if (months === 0) return "you have it";
  if (!Number.isFinite(months)) return "not reachable yet";
  return `in ${formatApproxDuration(months)} (${addMonths(today, Math.ceil(months - 1e-9)).getUTCFullYear()})`;
}

/** Whether today's sustainable income covers each country. */
export function CoverageList({ rows, homeCode }: { rows: CoverageRow[]; homeCode: string }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.country.code} className="flex items-center gap-3 py-3">
          <CountryName country={row.country} monthlyCost={row.monthlyCost} home={row.country.code === homeCode} />
          <p className={`text-right text-sm tabular-nums ${row.covered ? "text-positive" : "text-muted"}`}>
            {row.covered ? "✓ covered" : `${eur(-row.monthlyMargin)}/mo short`}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Where each country's figures come from. */
export function DatasetSources() {
  const { conversion, compiledOn } = costOfLiving;
  return (
    <div className="space-y-2 text-xs text-muted">
      <p>
        One person, country averages (cities vary a lot). Without rent: Numbeo. Rent: Wise, 1-bedroom outside the city
        centre. Compiled {compiledOn}; USD and GBP converted at {conversion.usdPerEur} USD/EUR and{" "}
        {conversion.gbpPerEur} GBP/EUR.
      </p>
      <ul className="space-y-1">
        {costOfLiving.countries.map((country) => (
          <li key={country.code}>
            <span className="font-medium text-foreground">{country.name}</span> ({country.referenceDate}): {country.source}
          </li>
        ))}
      </ul>
    </div>
  );
}
