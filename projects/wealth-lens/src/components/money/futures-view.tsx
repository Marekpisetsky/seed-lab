"use client";

import { X } from "lucide-react";
import { useEffect, useId, useMemo, useRef } from "react";
import { useI18n } from "@/components/i18n";
import { IntentLink } from "@/components/ui/intent-link";
import type { CalculationBundle } from "@/hooks/use-calculation";
import { useWidth } from "@/hooks/use-width";
import type { I18n } from "@/i18n";
import { localePath, PAGES } from "@/i18n/locales";
import { yearlyPath, type Scenario } from "@/lib/calculator";
import { COMMON_PERIOD } from "@/lib/indexes";
import type { ResolvedInvestment } from "@/lib/investment";
import { bandsFor, FUTURES, samplesFor } from "@/lib/projections";
import { ticks } from "@/lib/ticks";

/** How many of the possible futures the view draws. */
export const SHOWN_FUTURES = 50;
const HEIGHT = 240;
const PAD = { left: 2, right: 8, top: 10, bottom: 22 };
const FONT = 12;

const PERIOD = `${COMMON_PERIOD[0]}–${COMMON_PERIOD[1]}`;

/**
 * Where each possible future comes from, in one sentence: an asset's real
 * years shuffled; a mix's, for all its parts at once; or, for a growth of
 * one's own, years drawn at random near it, with world stocks' ups and
 * downs or the ones typed (in euros on the user's money).
 */
export function futuresSource(investment: ResolvedInvestment, scenario: Pick<Scenario, "capital">, total: number, { m, f }: I18n): string {
  const t = m.futures;
  const chosen = investment.investment;
  if (investment.simulation === "history" && chosen.kind === "asset") return t.shuffle(m.assets.of[chosen.asset], PERIOD);
  if (investment.simulation === "joint") return t.shuffleParts(PERIOD);
  const rate = f.rate(investment.realReturn);
  if (chosen.kind === "custom" && Math.abs(investment.volatility - investment.standard.volatility) < 1e-9) return t.normal(rate, PERIOD);
  const base = scenario.capital > 0 ? scenario.capital : total;
  return t.normalOwn(rate, f.percent(investment.volatility, { decimals: 0 }), f.eur(base * investment.volatility), f.eur(base));
}

function FuturesPlot({ samples, low, high, average, startYear, label }: { samples: number[][]; low: number[]; high: number[]; average: number[]; startYear: number; label: string }) {
  const { m, f } = useI18n();
  const [frame, width] = useWidth<HTMLDivElement>(320);
  const clip = useId();
  const years = average.length - 1;
  // The top a little over the upper edge of the band: a rare very good future runs off the top, the rest stays readable.
  const top = Math.max(high[years] * 1.25, ...average) || 1;
  const plotRight = Math.max(PAD.left + 40, width - PAD.right);
  const x = (year: number) => PAD.left + (years === 0 ? 0 : (year / years) * (plotRight - PAD.left));
  const y = (value: number) => PAD.top + (1 - Math.max(0, Math.min(value, top * 1.1)) / top) * (HEIGHT - PAD.top - PAD.bottom);
  const line = (values: readonly number[]) => values.map((value, year) => `${year === 0 ? "M" : "L"}${x(year).toFixed(1)},${y(value).toFixed(1)}`).join("");
  const band = `${line(high)}${[...low.keys()]
    .reverse()
    .map((year) => `L${x(year).toFixed(1)},${y(low[year]).toFixed(1)}`)
    .join("")}Z`;
  const labelYears = years <= 1 ? [0, years] : [0, Math.round(years / 2), years];
  return (
    <div ref={frame}>
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={label} className="block">
        <defs>
          <clipPath id={clip}>
            <rect x={0} y={PAD.top} width={width} height={HEIGHT - PAD.top - PAD.bottom} />
          </clipPath>
        </defs>
        {ticks(top).map((value) => (
          <g key={value}>
            <line x1={PAD.left} x2={plotRight} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeWidth={1} />
            {value > 0 && (
              <text x={PAD.left + 2} y={y(value) - 3} fontSize={FONT} fill="var(--muted)">
                {f.eurCompact(value)}
              </text>
            )}
          </g>
        ))}
        <g clipPath={`url(#${clip})`}>
          <path d={band} fill="var(--accent)" fillOpacity={0.14} />
          {samples.map((path, index) => (
            <path key={index} d={line(path)} fill="none" stroke="var(--chart-growth)" strokeOpacity={0.55} strokeWidth={1} />
          ))}
          <path d={line(average)} fill="none" stroke="var(--foreground)" strokeWidth={3} strokeLinejoin="round" />
        </g>
        {labelYears.map((year) => (
          <text key={year} x={x(year)} y={HEIGHT - 6} fontSize={FONT} fill="var(--muted)" textAnchor={year === 0 ? "start" : year === years ? "end" : "middle"}>
            {startYear + year}
          </text>
        ))}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-px w-4 bg-(--chart-growth)" />
          {m.futures.lines(samples.length)}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3 rounded-sm bg-accent/15 ring-1 ring-accent/30" />
          {m.futures.band}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-[3px] w-4 bg-foreground" />
          {m.futures.average}
        </li>
      </ul>
    </div>
  );
}

/**
 * "Where do these futures come from?": 50 of the 1,000 possible futures
 * the figures come from, thin; the band where 8 in 10 end, shaded; the
 * result itself, thick. Three sentences: what a future is made of, how many
 * there are, and what "1 in 10" means; then a way to real crises, in Test
 * my plan. A dialog: Escape or "Close" ends it, and the focus goes back.
 */
export function FuturesView({ bundle, onClose }: { bundle: CalculationBundle; onClose: () => void }) {
  const i18n = useI18n();
  const { m, f, locale } = i18n;
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const { calc, today } = bundle;
  const { scenario, investment, result } = calc;
  const years = result.years;
  const samples = useMemo(
    () => samplesFor(investment, { start: scenario.capital, monthly: scenario.monthly, years }, SHOWN_FUTURES),
    [investment, scenario.capital, scenario.monthly, years],
  );
  const bands = bandsFor(investment, { start: scenario.capital, monthly: scenario.monthly, years });
  const average = useMemo(() => yearlyPath(scenario, years).map((point) => point.total), [scenario, years]);
  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
    return () => node?.close();
  }, []);
  const startYear = today.getUTCFullYear();
  return (
    <dialog
      ref={dialog}
      aria-labelledby={heading}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-border bg-card p-4 text-foreground shadow-xl backdrop:bg-black/50 sm:p-6"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 id={heading} className="text-lg font-bold">
          {m.futures.title}
        </h2>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="-mr-2 -mt-2 inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-base font-medium text-muted hover:bg-border/40 hover:text-foreground"
        >
          <X aria-hidden="true" className="size-4" />
          {m.futures.close}
        </button>
      </div>
      <FuturesPlot
        samples={samples}
        low={bands.p10}
        high={bands.p90}
        average={average}
        startYear={startYear}
        label={m.futures.aria(samples.length, startYear + years, f.eur(bands.p10[years]), f.eur(bands.p90[years]))}
      />
      <div className="mt-4 space-y-2 text-base">
        <p>{futuresSource(investment, scenario, result.total, i18n)}</p>
        <p>{m.futures.count(f.number(FUTURES), samples.length)}</p>
        <p className="tabular-nums">{m.futures.meaning(f.number(FUTURES / 10), f.eur(bands.p10[years]))}</p>
      </div>
      <p className="mt-4">
        <IntentLink href={localePath(PAGES.test, locale)} className="inline-flex min-h-11 items-center font-medium text-accent underline-offset-2 hover:underline">
          {m.futures.test}
        </IntentLink>
      </p>
    </dialog>
  );
}
