"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { RadioGroup } from "@/components/ui/radio-group";
import { useWidth } from "@/hooks/use-width";
import { availablePeriods, changeTicks, defaultPeriod, LINE_PERIODS, lineChange, loadLines, pointDates, type LinePeriod, type LinePeriodId, type LinesFile } from "@/lib/lines";
import { instrumentById, MARKET, type Instrument } from "@/lib/market-data";

const HEIGHT = 180;
const PAD = { left: 2, right: 46, top: 10, bottom: 22 };
const FONT = 11;
const DAY_MS = 24 * 60 * 60 * 1000;

function Swatch({ color, thin = false }: { color: string; thin?: boolean }) {
  return (
    <svg aria-hidden="true" width="16" height="8" className="inline-block">
      <line x1="0" x2="16" y1="4" y2="4" stroke={color} strokeWidth={thin ? 1.25 : 2.5} />
    </svg>
  );
}

/** The period's line, and its index fund's in thin, as the change since the first week. */
function Plot({ id, period, label, fundLabel }: { id: LinePeriodId; period: LinePeriod; label: string; fundLabel: string | null }) {
  const { m, f } = useI18n();
  const t = m.stocks.line;
  const [frame, width] = useWidth<HTMLDivElement>(320);
  const [hover, setHover] = useState<number | null>(null);
  const dates = pointDates(period);
  const days = dates.map((date) => Date.parse(`${date}T00:00:00Z`) / DAY_MS);
  const own = period.line.map((value) => value / 100 - 1);
  const fund = period.index?.map((value) => value / 100 - 1) ?? null;
  const all = [...own, ...(fund ?? []), 0];
  const low = Math.min(...all);
  const high = Math.max(...all);
  const margin = (high - low) * 0.06 || 0.01;
  const top = high + margin;
  const bottom = low - margin;
  const plotRight = Math.max(PAD.left + 40, width - PAD.right);
  const x = (index: number) => PAD.left + ((days[index] - days[0]) / Math.max(1, days[days.length - 1] - days[0])) * (plotRight - PAD.left);
  const y = (change: number) => PAD.top + ((top - change) / (top - bottom)) * (HEIGHT - PAD.top - PAD.bottom);
  const path = (values: readonly number[]) => values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join("");
  const last = own.length - 1;
  const shown = hover === null ? null : hover;
  const showAt = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const at = event.clientX - box.left;
    let nearest = 0;
    for (let index = 1; index < days.length; index++) if (Math.abs(x(index) - at) < Math.abs(x(nearest) - at)) nearest = index;
    setHover(nearest);
  };
  // The tooltip sits beside the point, on the side with more room, and never leaves the chart.
  const tip = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = tip.current;
    if (!node || shown === null) return;
    const wanted = shown > last / 2 ? x(shown) - 8 - node.offsetWidth : x(shown) + 8;
    node.style.left = `${Math.min(Math.max(0, wanted), Math.max(0, width - node.offsetWidth))}px`;
  });
  const labels = [0, Math.round(last / 2), last];
  const aria = t.aria(label, t.periodNames[id], f.percent(own[last], { signed: true })) + (fund && fundLabel ? t.ariaIndex(fundLabel, f.percent(fund[last], { signed: true })) : "");

  return (
    <div ref={frame} className="relative">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block touch-pan-y select-none"
        role="img"
        aria-label={aria}
        onPointerDown={showAt}
        onPointerMove={showAt}
        onPointerLeave={(event) => event.pointerType === "mouse" && setHover(null)}
      >
        {changeTicks(bottom, top).map((value) => (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={plotRight}
              y1={y(value)}
              y2={y(value)}
              stroke={value === 0 ? "var(--muted)" : "var(--border)"}
              strokeWidth={1}
              strokeDasharray={value === 0 ? "3 3" : undefined}
            />
            <text x={plotRight + 4} y={y(value) + FONT / 3} fontSize={FONT} fill="var(--muted)">
              {f.percent(value, { signed: value !== 0, decimals: 0 })}
            </text>
          </g>
        ))}
        {fund && <path d={path(fund)} fill="none" stroke="var(--muted)" strokeWidth={1.25} strokeLinejoin="round" />}
        <path d={path(own)} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
        {labels.map((index, position) => (
          <text
            key={position}
            x={x(index)}
            y={HEIGHT - 6}
            fontSize={FONT}
            fill="var(--muted)"
            textAnchor={position === 0 ? "start" : position === labels.length - 1 ? "end" : "middle"}
          >
            {f.monthYear(new Date(`${dates[index]}T00:00:00Z`))}
          </text>
        ))}
        {shown !== null && (
          <g>
            <line x1={x(shown)} x2={x(shown)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--muted)" strokeWidth={1} />
            {fund && <circle cx={x(shown)} cy={y(fund[shown])} r={3} fill="var(--muted)" stroke="var(--card)" strokeWidth={1.5} />}
            <circle cx={x(shown)} cy={y(own[shown])} r={4} fill="var(--accent)" stroke="var(--card)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {shown !== null && (
        <div ref={tip} className="pointer-events-none absolute top-0 left-0 z-10 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs shadow-sm tabular-nums">
          <p className="font-medium">{shown === last ? f.date(dates[shown]) : t.weekOf(f.date(dates[shown]))}</p>
          <p>
            <Swatch color="var(--accent)" /> {label} {f.percent(own[shown], { signed: true })}
          </p>
          {fund && fundLabel && (
            <p className="text-muted">
              <Swatch color="var(--muted)" thin /> {fundLabel} {f.percent(fund[shown], { signed: true })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * How an instrument moved, as a line: its weekly closes as the change since
 * the period's first week (1, 3 or 5 years, or all the data the site keeps;
 * a period the data does not reach cannot be picked), with the change over
 * the period beside the choice, in green or red. A stock's index fund is
 * drawn thin over the same weeks, from the same start. The figures come
 * from the site itself when the row is opened; never a price.
 */
export function PriceLines({ instrument }: { instrument: Instrument }) {
  const { m, f } = useI18n();
  const t = m.stocks.line;
  const [file, setFile] = useState<LinesFile | null | undefined>(undefined);
  const [picked, setPicked] = useState<LinePeriodId | null>(null);
  useEffect(() => {
    let live = true;
    void loadLines(instrument.id).then((loaded) => live && setFile(loaded));
    return () => {
      live = false;
    };
  }, [instrument.id]);

  // Held at the chart's height while it loads, so nothing below it moves.
  if (file === undefined) return <div aria-hidden="true" style={{ height: HEIGHT + 56 }} />;
  if (file === null) return <p className="text-sm text-muted">{t.none}</p>;

  const available = availablePeriods(file);
  const current = picked && available.includes(picked) ? picked : defaultPeriod(file);
  const period = current ? file.periods[current] : undefined;
  if (!current || !period) return <p className="text-sm text-muted">{t.none}</p>;

  const change = lineChange(period.line);
  const fund = file.benchmark ? instrumentById(file.benchmark) : undefined;
  const fundLabel = fund ? t.fund(m.assets.name[fund.index], fund.id) : null;
  const fundStart = fund ? (MARKET.prices[fund.id]?.stats?.from ?? MARKET.prices[fund.id]?.growth?.from ?? null) : null;

  return (
    <figure className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RadioGroup
          label={t.period}
          options={LINE_PERIODS.map((id) => ({
            value: id,
            disabled: !available.includes(id),
            label: (
              <>
                <span aria-hidden="true">{t.periods[id]}</span>
                <span className="sr-only">{t.periodNames[id]}</span>
              </>
            ),
          }))}
          value={current}
          onChange={setPicked}
          className="inline-flex rounded-md border border-border p-0.5 text-xs"
          optionClassName={(checked) => `min-h-11 min-w-11 rounded px-2 py-1 font-medium ${checked ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
        />
        <p className="text-right tabular-nums" aria-live="polite">
          <span className={`block text-lg font-semibold leading-tight ${change >= 0 ? "text-positive" : "text-negative"}`}>{f.percent(change, { signed: true })}</span>
          <span className="block text-xs text-muted">{t.since(f.monthYear(new Date(`${period.from}T00:00:00Z`)))}</span>
        </p>
      </div>
      <Plot id={current} period={period} label={instrument.id} fundLabel={period.index ? fundLabel : null} />
      <figcaption className="space-y-1 text-xs text-muted">
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          <span>
            <Swatch color="var(--accent)" /> {instrument.name} {f.percent(change, { signed: true })}
          </span>
          {period.index && fundLabel && (
            <span>
              <Swatch color="var(--muted)" thin /> {fundLabel} {f.percent(lineChange(period.index), { signed: true })}
            </span>
          )}
        </span>
        {fund && !period.index && fundStart && <span className="block">{t.noIndex(fund.id, fundStart.slice(0, 4))}</span>}
        {fund && period.index && fund.currency !== instrument.currency && <span className="block">{t.otherCurrency(fund.currency, instrument.currency)}</span>}
      </figcaption>
    </figure>
  );
}
