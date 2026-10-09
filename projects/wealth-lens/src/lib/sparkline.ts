/** Geometry for the small line charts (Test my plan's paths). */

/**
 * SVG polyline points ("x,y x,y …") fitting the values into a width × height
 * box, oldest on the left, highest at the top. A flat series is drawn
 * through the middle.
 */
export function sparklinePoints(values: readonly number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = index * step;
      const y = span === 0 ? height / 2 : height - ((value - min) / span) * height;
      return `${round(x)},${round(y)}`;
    })
    .join(" ");
}

const round = (value: number) => Math.round(value * 10) / 10;
