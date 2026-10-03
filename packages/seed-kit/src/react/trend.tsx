/**
 * Gains and losses for React apps: ▲ before a gain, ▼ before a loss
 * (icons.ts), next to the figure, which carries the sign (+/−). So a
 * change never reads by its colour alone. The mark takes the colour and
 * size of the text; no change, no mark. Pass the change as it is shown
 * (rounded), so the mark and the sign agree.
 */

import type { ReactNode } from "react";
import { TREND_ICONS, trendOf } from "../icons.ts";

/** The mark alone, before a sentence that starts with the figure. */
export function TrendIcon({ change }: { change: number | null | undefined }) {
  const trend = trendOf(change);
  return trend ? <span dangerouslySetInnerHTML={{ __html: TREND_ICONS[trend] }} /> : null;
}

/** The mark and its figure, on one line. */
export function Trend({ change, children }: { change: number | null | undefined; children: ReactNode }) {
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <TrendIcon change={change} />
      {children}
    </span>
  );
}
