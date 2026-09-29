import { sparklinePoints } from "@/lib/sparkline";

const WIDTH = 96;
const HEIGHT = 28;

/** A tiny line of the price over the period; decorative, the % next to it carries the meaning. */
export function Sparkline({ closes, rising }: { closes: readonly number[]; rising: boolean }) {
  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`-1 -1 ${WIDTH + 2} ${HEIGHT + 2}`}
      aria-hidden="true"
      className={rising ? "text-positive" : "text-negative"}
    >
      <polyline
        points={sparklinePoints(closes, WIDTH, HEIGHT)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
