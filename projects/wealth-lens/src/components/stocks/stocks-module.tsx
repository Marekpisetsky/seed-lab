"use client";

import { StocksContent } from "./stocks-content";

/**
 * Holdings, charts and the curated list. Rendered on the server too (with
 * no holdings, as on arrival), so the list is on screen before any code
 * runs; the charts themselves load when opened.
 */
export function StocksModule() {
  return <StocksContent />;
}
