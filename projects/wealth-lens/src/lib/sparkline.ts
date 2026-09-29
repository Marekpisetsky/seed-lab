/** Geometry for the small line charts in the Charts summary list. */

import type { PricePoint } from "./prices";

/**
 * SVG polyline points ("x,y x,y …") fitting the closes into a width × height
 * box, oldest on the left, highest price at the top. A flat series is drawn
 * through the middle.
 */
export function sparklinePoints(points: readonly PricePoint[], width: number, height: number): string {
  if (points.length === 0) return "";
  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  return closes
    .map((close, index) => {
      const x = index * step;
      const y = span === 0 ? height / 2 : height - ((close - min) / span) * height;
      return `${round(x)},${round(y)}`;
    })
    .join(" ");
}

const round = (value: number) => Math.round(value * 10) / 10;

/** Points from the last `days` calendar days of the series. */
export function lastDays(points: readonly PricePoint[], days: number): PricePoint[] {
  const last = points.at(-1);
  if (!last) return [];
  const from = new Date(`${last.time}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - days);
  const start = from.toISOString().slice(0, 10);
  return points.filter((point) => point.time >= start);
}

/** Change from the first to the last point, as a fraction; `null` if undefined. */
export function periodChange(points: readonly PricePoint[]): number | null {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last || first === last || first.close <= 0) return null;
  return last.close / first.close - 1;
}
