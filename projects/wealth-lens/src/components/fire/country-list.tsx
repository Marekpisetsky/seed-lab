import { costOfLiving, type CountryCost } from "@/lib/cost-of-living";
import { addMonths } from "@/lib/dates";
import type { CoverageRow, RequirementRow } from "@/lib/fire";
import { formatApproxDuration, formatMoney } from "@/lib/format";
import { BASE_CURRENCY } from "@/lib/types";

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

interface SelectableProps {
  homeCode: string;
  /** Country that is the active goal, if any. */
  goalCode: string | null;
  /** Makes a country the active goal. */
  onSelect: (code: string) => void;
}

/** A whole row is one button: tapping a country makes it the goal. */
function CountryRow({
  country,
  monthlyCost,
  home,
  goal,
  onSelect,
  children,
}: {
  country: CountryCost;
  monthlyCost: number;
  home: boolean;
  goal: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={goal}
        onClick={onSelect}
        className={`-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-3 text-left hover:bg-border/40 ${
          goal ? "bg-accent/10 ring-1 ring-accent" : ""
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium">
            {country.name}
            {home && <span className="ml-2 rounded bg-border/60 px-1.5 py-0.5 text-xs font-normal text-muted">home</span>}
            {goal && <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-xs font-normal text-accent-foreground">your goal</span>}
          </span>
          <span className="block text-xs text-muted tabular-nums">≈ {eur(monthlyCost)}/month</span>
        </span>
        {children}
      </button>
    </li>
  );
}

/** Capital needed per country, when you get there, and what it pays each month. */
export function RequirementList({
  rows,
  today,
  homeCode,
  goalCode,
  onSelect,
}: { rows: RequirementRow[]; today: Date } & SelectableProps) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <CountryRow
          key={row.country.code}
          country={row.country}
          monthlyCost={row.monthlyCost}
          home={row.country.code === homeCode}
          goal={row.country.code === goalCode}
          onSelect={() => onSelect(row.country.code)}
        >
          <span className="text-right">
            <span className="block font-semibold tabular-nums">{eur(row.requiredCapital)}</span>
            <span className="block text-xs text-muted">{whenReached(row.monthsToReach, today)}</span>
          </span>
        </CountryRow>
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
export function CoverageList({ rows, homeCode, goalCode, onSelect }: { rows: CoverageRow[] } & SelectableProps) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <CountryRow
          key={row.country.code}
          country={row.country}
          monthlyCost={row.monthlyCost}
          home={row.country.code === homeCode}
          goal={row.country.code === goalCode}
          onSelect={() => onSelect(row.country.code)}
        >
          <span className={`text-right text-sm tabular-nums ${row.covered ? "text-positive" : "text-muted"}`}>
            {row.covered ? "✓ covered" : `${eur(-row.monthlyMargin)}/mo short`}
          </span>
        </CountryRow>
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
