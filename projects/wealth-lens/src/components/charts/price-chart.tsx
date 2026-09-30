"use client";

import type { AutoscaleInfo } from "lightweight-charts";
import { useEffect, useRef } from "react";
import { useI18n } from "@/components/i18n";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LOCALE_SETTINGS } from "@/i18n/locales";
import { includePriceInRange, visibleRangeStart, type PricePoint } from "@/lib/prices";

interface PriceChartProps {
  points: readonly PricePoint[];
  /** Drawn as a horizontal line: is the price above or below what I paid? */
  averageCost: number | null;
  /** Text alternative for the canvas. */
  label: string;
}

const DEFAULT_WINDOW_YEARS = 2;

function cssVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Daily closes of one instrument with TradingView's lightweight-charts. The
 * library touches `window`, so it is imported inside the effect and never
 * runs on the server. The chart is rebuilt when the data or theme changes.
 */
export function PriceChart({ points, averageCost, label }: PriceChartProps) {
  const { locale, m } = useI18n();
  const paidLabel = m.stocks.paidLine;
  const intl = LOCALE_SETTINGS[locale].intl;
  const containerRef = useRef<HTMLDivElement>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length === 0) return;
    let disposed = false;
    let remove = () => {};

    void import("lightweight-charts").then(({ createChart, ColorType, LineSeries, LineStyle }) => {
      if (disposed) return;
      const foreground = cssVariable("--foreground");
      const muted = cssVariable("--muted");
      const border = cssVariable("--border");
      const accent = cssVariable("--accent");

      const chart = createChart(container, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: muted,
          fontFamily: "inherit",
        },
        grid: { vertLines: { visible: false }, horzLines: { color: border } },
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false },
        crosshair: { horzLine: { labelBackgroundColor: foreground }, vertLine: { labelBackgroundColor: foreground } },
        // The page's language, never the browser's own tag: that can be one
        // Intl rejects (e.g. "en-US@posix"), which would leave the chart blank.
        localization: { locale: intl },
      });

      const series = chart.addSeries(LineSeries, {
        color: accent,
        lineWidth: 2,
        priceLineVisible: false,
        // Keep the average-cost line in view even when the price is far from it.
        autoscaleInfoProvider: (base: () => AutoscaleInfo | null) => {
          const info = base();
          return info && { ...info, priceRange: includePriceInRange(info.priceRange, averageCost) };
        },
      });
      series.setData(points.map(({ time, close }) => ({ time, value: close })));

      if (averageCost !== null && averageCost > 0) {
        series.createPriceLine({
          price: averageCost,
          color: foreground,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: paidLabel,
        });
      }

      const from = visibleRangeStart(points, DEFAULT_WINDOW_YEARS);
      const to = points.at(-1)?.time;
      if (from && to) chart.timeScale().setVisibleRange({ from, to });
      else chart.timeScale().fitContent();

      remove = () => chart.remove();
    });

    return () => {
      disposed = true;
      remove();
    };
  }, [points, averageCost, paidLabel, intl, colorScheme]);

  return <div ref={containerRef} role="img" aria-label={label} className="h-64 w-full sm:h-72" />;
}
