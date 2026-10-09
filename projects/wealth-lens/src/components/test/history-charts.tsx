"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n";
import { useWidth } from "@/hooks/use-width";
import type { StartYears } from "@/lib/history-test";
import { ticks } from "@/lib/ticks";

const HEIGHT = 180;
const PAD = { left: 2, right: 10, top: 12, bottom: 22 };
const FONT = 11;

/** The shape over a marked start year: ▼ the worst, ◆ the middle, ▲ the best. Each has its own, so none is told by colour alone. */
type Shape = "down" | "diamond" | "up";
const shapePath = (shape: Shape, cx: number, cy: number, r: number) =>
  shape === "down"
    ? `M${cx - r},${cy - r * 0.8}H${cx + r}L${cx},${cy + r * 0.9}Z`
    : shape === "up"
      ? `M${cx - r},${cy + r * 0.8}H${cx + r}L${cx},${cy - r * 0.9}Z`
      : `M${cx},${cy - r}L${cx + r},${cy}L${cx},${cy + r}L${cx - r},${cy}Z`;

function Swatch({ color, dashed = false, shape }: { color: string; dashed?: boolean; shape?: Shape }) {
  if (shape) {
    return (
      <svg aria-hidden="true" width="12" height="12" className="inline-block shrink-0">
        <path d={shapePath(shape, 6, 6, 5)} fill={color} />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width="16" height="8" className="inline-block">
      <line x1="0" x2="16" y1="4" y2="4" stroke={color} strokeWidth={dashed ? 1.5 : 2} strokeDasharray={dashed ? "4 3" : undefined} />
    </svg>
  );
}

/** Horizontal grid lines, recessive, under the marks. */
function GridLines({ max, y, right }: { max: number; y: (value: number) => number; right: number }) {
  return (
    <>
      {ticks(max).map((value) => (
        <line key={value} x1={PAD.left} x2={right} y1={y(value)} y2={y(value)} stroke="var(--border)" strokeWidth={1} />
      ))}
    </>
  );
}

/** The grid's amounts, over the marks with a halo so a bar never hides them. */
function GridLabels({ max, y }: { max: number; y: (value: number) => number }) {
  const { f } = useI18n();
  return (
    <>
      {ticks(max)
        .filter((value) => value > 0)
        .map((value) => (
          <text key={value} x={PAD.left + 2} y={y(value) - 3} fontSize={FONT} fill="var(--muted)" stroke="var(--card)" strokeWidth={3} paintOrder="stroke">
            {f.curCompact(value)}
          </text>
        ))}
    </>
  );
}

interface PathChartProps {
  /** The money at the start and at the end of each year. */
  path: readonly number[];
  /** The plan's average growth over the same years. */
  average: readonly number[];
  startYear: number;
  /** Indexes into `path` of the highest point before the fall and the lowest after it. */
  fall: { peak: number; trough: number } | null;
  label: string;
}

/** One real run of the plan, year by year, with the average growth dashed beside it. */
export function PathChart({ path, average, startYear, fall, label }: PathChartProps) {
  const { m, f } = useI18n();
  const t = m.test;
  const [frame, width] = useWidth<HTMLDivElement>(320);
  const [hover, setHover] = useState<number | null>(null);
  const years = path.length - 1;
  const top = Math.max(...path, ...average) * 1.05 || 1;
  const right = Math.max(PAD.left + 40, width - PAD.right);
  const x = (index: number) => PAD.left + (years === 0 ? 0 : (index / years) * (right - PAD.left));
  const y = (value: number) => PAD.top + (1 - Math.max(0, value) / top) * (HEIGHT - PAD.top - PAD.bottom);
  const line = (values: readonly number[]) => values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join("");
  const shown = hover ?? years;
  // Point 0 is the start of the first year; point i, the end of year startYear + i − 1.
  const yearOf = (index: number) => (index === 0 ? t.startOf(startYear) : String(startYear + index - 1));
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setHover(Math.max(0, Math.min(years, Math.round(((event.clientX - box.left - PAD.left) / (right - PAD.left)) * years))));
  };
  return (
    <figure className="space-y-2">
      <div ref={frame} className="w-full">
        <svg
          role="img"
          aria-label={label}
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block touch-pan-y"
          onPointerMove={move}
          onPointerDown={move}
          onPointerLeave={() => setHover(null)}
        >
          <GridLines max={top} y={y} right={right} />
          {fall && fall.peak < years && (
            <rect
              x={x(fall.peak)}
              y={PAD.top}
              width={Math.max(2, x(Math.min(fall.trough, years)) - x(fall.peak))}
              height={HEIGHT - PAD.top - PAD.bottom}
              fill="var(--negative)"
              opacity={0.12}
            />
          )}
          <path d={line(average)} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 3" />
          <path d={line(path)} fill="none" stroke="var(--chart-put-in)" strokeWidth={2} strokeLinejoin="round" />
          <GridLabels max={top} y={y} />
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--muted)" strokeWidth={1} />}
          {[0, years].map((index) => (
            <text key={index} x={x(index)} y={HEIGHT - 6} fontSize={FONT} fill="var(--muted)" textAnchor={index === 0 ? "start" : "end"}>
              {index === 0 ? startYear : startYear + index - 1}
            </text>
          ))}
        </svg>
      </div>
      <p className="text-sm tabular-nums" aria-live="off">
        {yearOf(shown)}: <span className="font-medium">{f.cur(path[shown])}</span>
      </p>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Swatch color="var(--chart-put-in)" /> {t.yourMoney}
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch color="var(--muted)" dashed /> {t.averageLine}
        </span>
        {fall && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-2.5 w-4 rounded-sm bg-negative/15" /> {t.crash}
          </span>
        )}
      </figcaption>
      <details className="text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center text-accent">{t.table}</summary>
        <table className="w-full text-left tabular-nums">
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="py-1 font-medium">
                {t.year}
              </th>
              <th scope="col" className="py-1 font-medium">
                {t.money}
              </th>
              <th scope="col" className="py-1 font-medium">
                {t.averageLine}
              </th>
            </tr>
          </thead>
          <tbody>
            {path.map((value, index) => (
              <tr key={index} className="border-t border-border">
                <th scope="row" className="py-1 font-normal">
                  {yearOf(index)}
                </th>
                <td className="py-1">{f.cur(value)}</td>
                <td className="py-1 text-muted">{f.cur(average[index])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** What the plan's years gave from every start year: one bar each, the worst, middle and best marked. */
export function StartYearsChart({ every, average, label }: { every: StartYears; average: number; label: string }) {
  const { m, f } = useI18n();
  const t = m.test.every;
  const [frame, width] = useWidth<HTMLDivElement>(320);
  const [hover, setHover] = useState<number | null>(null);
  const { starts } = every;
  const top = Math.max(average, ...starts.map((start) => start.final)) * 1.05 || 1;
  const right = Math.max(PAD.left + 40, width - PAD.right);
  const slot = (right - PAD.left) / starts.length;
  const gap = slot > 6 ? 2 : slot > 3 ? 1 : 0;
  const y = (value: number) => PAD.top + (1 - Math.max(0, value) / top) * (HEIGHT - PAD.top - PAD.bottom);
  const marked = new Map<number, { color: string; name: string; shape: Shape }>([
    [every.worst.year, { color: "var(--negative)", name: t.worst, shape: "down" }],
    [every.median.year, { color: "var(--foreground)", name: t.middle, shape: "diamond" }],
    [every.best.year, { color: "var(--positive)", name: t.best, shape: "up" }],
  ]);
  const shown = hover === null ? null : starts[hover];
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setHover(Math.max(0, Math.min(starts.length - 1, Math.floor((event.clientX - box.left - PAD.left) / slot))));
  };
  return (
    <figure className="space-y-2">
      <div ref={frame} className="w-full">
        <svg
          role="img"
          aria-label={label}
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block touch-pan-y"
          onPointerMove={move}
          onPointerDown={move}
          onPointerLeave={() => setHover(null)}
        >
          <GridLines max={top} y={y} right={right} />
          {starts.map((start, index) => {
            const mark = marked.get(start.year);
            const barTop = y(start.final);
            return (
              <rect
                key={start.year}
                x={PAD.left + index * slot + gap / 2}
                y={barTop}
                width={Math.max(1, slot - gap)}
                height={Math.max(1, y(0) - barTop)}
                rx={slot > 8 ? 2 : 0}
                fill={mark?.color ?? "var(--chart-put-in)"}
                opacity={hover === null || hover === index || mark ? 1 : 0.55}
              />
            );
          })}
          <line x1={PAD.left} x2={right} y1={y(average)} y2={y(average)} stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 3" />
          {starts.map((start, index) => {
            const mark = marked.get(start.year);
            return mark ? <path key={start.year} d={shapePath(mark.shape, PAD.left + (index + 0.5) * slot, Math.max(PAD.top - 2, y(start.final) - 8), 5)} fill={mark.color} stroke="var(--card)" strokeWidth={1.5} /> : null;
          })}
          <GridLabels max={top} y={y} />
          {[0, starts.length - 1].map((index) => (
            <text key={index} x={PAD.left + (index + (index === 0 ? 0 : 1)) * slot} y={HEIGHT - 6} fontSize={FONT} fill="var(--muted)" textAnchor={index === 0 ? "start" : "end"}>
              {starts[index].year}
            </text>
          ))}
        </svg>
      </div>
      <p className="min-h-5 text-sm tabular-nums" aria-live="off">
        {shown && t.mark(shown.year, f.cur(shown.final))}
      </p>
      <figcaption className="grid gap-1 text-sm tabular-nums sm:grid-cols-3">
        {[...marked].map(([year, mark]) => {
          const start = starts.find((entry) => entry.year === year);
          return (
            <span key={mark.name} className="flex items-center gap-1.5">
              <Swatch color={mark.color} shape={mark.shape} />
              <span className="font-medium">{mark.name}</span>
              <span>{start && t.mark(start.year, f.cur(start.final))}</span>
            </span>
          );
        })}
        <span className="flex items-center gap-1.5 text-xs text-muted sm:col-span-3">
          <Swatch color="var(--muted)" dashed /> {m.test.averageLine}: {f.cur(average)}
        </span>
      </figcaption>
      <details className="text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center text-accent">{m.test.table}</summary>
        <table className="w-full text-left tabular-nums">
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="py-1 font-medium">
                {t.startYear}
              </th>
              <th scope="col" className="py-1 font-medium">
                {m.test.money}
              </th>
            </tr>
          </thead>
          <tbody>
            {starts.map((start) => (
              <tr key={start.year} className="border-t border-border">
                <th scope="row" className="py-1 font-normal">
                  {start.year}
                </th>
                <td className="py-1">
                  {f.cur(start.final)}
                  {marked.has(start.year) && <span className="ml-2 text-xs text-muted">{marked.get(start.year)?.name}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
