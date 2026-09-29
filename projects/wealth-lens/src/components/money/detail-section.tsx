"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatEur, formatEurRounded } from "@/lib/format";
import { monthlyWithdrawal } from "@/lib/finance";
import { valueAt, type Report } from "@/lib/report";
import { wealthPercentiles, type WealthPercentiles } from "@/lib/simulation";

const HEIGHT = 220;
const PAD = { left: 4, right: 48, top: 12, bottom: 24 };
const FONT = 12;

/** The element's width in CSS pixels, so the chart is drawn at its real size and its text stays legible. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** €1,234,567 → "€1.2M", €99,000 → "€99k": short labels for an axis. */
function compactEur(amount: number): string {
  if (amount >= 1e6) return `€${(amount / 1e6).toFixed(amount >= 1e7 ? 0 : 1)}M`;
  if (amount >= 1e3) return `€${Math.round(amount / 1e3)}k`;
  return `€${Math.round(amount)}`;
}

/** Round axis ticks: 0 and two more at a clean step. */
function ticks(max: number): number[] {
  const rough = max / 3;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ?? rough;
  return [0, step, step * 2, step * 3].filter((value) => value <= max * 1.05);
}

function yearsShown(report: Report): number {
  const { answer } = report;
  if (answer.mode === "horizon") return Math.round(answer.months / 12);
  if (answer.months === 0 || !Number.isFinite(answer.months)) return 30;
  return Math.min(50, Math.max(10, Math.ceil(answer.months / 12) + 2));
}

function GrowthChart({ bands, report }: { bands: WealthPercentiles; report: Report }) {
  const [hover, setHover] = useState<number | null>(null);
  const [frame, width] = useWidth<HTMLDivElement>(320);
  const years = bands.p50.length - 1;
  const target = report.goal.status.target;
  const top = Math.max(target, ...bands.p90) * 1.05;
  const x = (year: number) => PAD.left + (year / years) * (width - PAD.left - PAD.right);
  const y = (value: number) => PAD.top + (1 - value / top) * (HEIGHT - PAD.top - PAD.bottom);
  const startYear = report.today.getUTCFullYear();
  const band =
    bands.p90.map((value, year) => `${year === 0 ? "M" : "L"}${x(year).toFixed(1)},${y(value).toFixed(1)}`).join("") +
    bands.p10
      .map((value, year) => [year, value] as const)
      .reverse()
      .map(([year, value]) => `L${x(year).toFixed(1)},${y(value).toFixed(1)}`)
      .join("") +
    "Z";
  const median = bands.p50.map((value, year) => `${year === 0 ? "M" : "L"}${x(year).toFixed(1)},${y(value).toFixed(1)}`).join("");
  const labelYears = [0, Math.round(years / 2), years];

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm">
        <span className="font-medium">Your money, year by year</span>
        <span className="block text-xs text-muted">Line: the middle outcome. Band: 8 in 10 simulated outcomes.</span>
      </figcaption>
      <div ref={frame} className="relative">
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block touch-none"
          role="img"
          aria-label={`Projected money over ${years} years, in today's euros: the middle outcome reaches ${formatEur(bands.p50[years])}`}
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const year = Math.round(((event.clientX - box.left - PAD.left) / (width - PAD.left - PAD.right)) * years);
            setHover(Math.min(years, Math.max(0, year)));
          }}
          onPointerLeave={() => setHover(null)}
        >
          {ticks(top).map((value) => (
            <g key={value}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeWidth={1} />
              <text x={width - PAD.right + 6} y={y(value) + FONT / 3} fontSize={FONT} fill="var(--muted)">
                {compactEur(value)}
              </text>
            </g>
          ))}
          <path d={band} fill="var(--accent)" fillOpacity={0.12} stroke="none" />
          <line x1={PAD.left} x2={width - PAD.right} y1={y(target)} y2={y(target)} stroke="var(--foreground)" strokeOpacity={0.5} strokeWidth={1} />
          <text x={PAD.left + 4} y={y(target) - 6} fontSize={FONT} fill="var(--foreground)">
            {report.goal.status.connection.name}: {compactEur(target)}
          </text>
          <path d={median} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {labelYears.map((year) => (
            <text key={year} x={x(year)} y={HEIGHT - 6} fontSize={FONT} fill="var(--muted)" textAnchor={year === 0 ? "start" : year === years ? "end" : "middle"}>
              {startYear + year}
            </text>
          ))}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--muted)" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(bands.p50[hover])} r={5} fill="var(--accent)" stroke="var(--card)" strokeWidth={2} />
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-0 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs shadow-sm tabular-nums"
            style={{ left: x(hover), transform: hover > years / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}
          >
            <p className="font-medium">{startYear + hover}</p>
            <p>{formatEurRounded(bands.p50[hover])}</p>
            <p className="text-muted">
              {formatEurRounded(bands.p10[hover])} – {formatEurRounded(bands.p90[hover])}
            </p>
          </div>
        )}
      </div>
    </figure>
  );
}

const whole = (amount: number) => Math.round(amount).toLocaleString("en-US");

function YearTable({ report, years }: { report: Report; years: number }) {
  const { scenario, today } = report;
  const rows = Array.from({ length: years }, (_, index) => {
    const year = index + 1;
    const total = valueAt(scenario, year * 12);
    const added = scenario.capital + scenario.monthly * 12 * year;
    return { year: today.getUTCFullYear() + year, added, growth: total - added, total, pays: monthlyWithdrawal(total, scenario.withdrawalRate) };
  });
  return (
    <div className="max-h-96 overflow-auto rounded-lg border border-border">
      <table className="w-full text-right text-xs tabular-nums">
        <caption className="sr-only">Year by year in today&apos;s euros, at the average growth</caption>
        <thead className="sticky top-0 bg-card text-muted">
          <tr>
            <th scope="col" className="px-1.5 py-2 text-left font-medium">Year</th>
            <th scope="col" className="px-1.5 py-2 font-medium">Put in</th>
            <th scope="col" className="px-1.5 py-2 font-medium">Growth</th>
            <th scope="col" className="px-1.5 py-2 font-medium">Total</th>
            <th scope="col" className="px-1.5 py-2 font-medium">Pays a month</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year} className="border-t border-border">
              <th scope="row" className="px-1.5 py-1.5 text-left font-normal">{row.year}</th>
              <td className="px-1.5 py-1.5">{whole(row.added)}</td>
              <td className="px-1.5 py-1.5">{whole(row.growth)}</td>
              <td className="px-1.5 py-1.5 font-medium">{whole(row.total)}</td>
              <td className="px-1.5 py-1.5">{whole(row.pays)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The growth curve with its uncertainty band and the table, folded away; simulated only when opened. */
export function DetailSection({ report }: { report: Report }) {
  const [open, setOpen] = useState(false);
  const years = yearsShown(report);
  const { scenario, investment } = report;
  const bands = useMemo(
    () =>
      open && years > 0
        ? wealthPercentiles({ start: scenario.capital, monthly: scenario.monthly, returns: investment.returns, years })
        : null,
    [open, years, scenario.capital, scenario.monthly, investment.returns],
  );
  return (
    <details className="group rounded-xl border border-border bg-card" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Detail: growth and year by year
        <ChevronDown aria-hidden="true" className="size-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      {bands && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          <GrowthChart bands={bands} report={report} />
          <YearTable report={report} years={years} />
          <p className="text-xs text-muted">
            Table: in today&apos;s euros, at the average growth of {investment.name} ({investment.period.join("–")}). Band:
            1,000 simulations drawing each year&apos;s return from that history.
          </p>
        </div>
      )}
    </details>
  );
}
