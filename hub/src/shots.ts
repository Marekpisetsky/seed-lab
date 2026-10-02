/**
 * The screenshots of the tools on the front page: taken from each tool's
 * real build by scripts/shots.ts (`npm run shots`), listed in
 * content/shots.json, served from static/shots/. Each is a WebP at a few
 * widths, loaded only when it comes near the screen, with its size given
 * so nothing jumps while it loads.
 */

import shotsJson from "../content/shots.json" with { type: "json" };
import { html, type Html } from "../../packages/seed-kit/src/html.ts";
import type { Locale } from "../../packages/seed-kit/src/locales.ts";

/** The big picture in the first band, and the one on each tool's card: what is captured, and at which widths it is saved. */
export const SHOT_KINDS = [
  { name: "hero", viewport: { width: 1280, height: 900 }, widths: [640, 1280, 1920] },
  { name: "card", viewport: { width: 1040, height: 650 }, widths: [480, 960] },
] as const;
export type ShotKind = (typeof SHOT_KINDS)[number]["name"];

export interface ShotSize {
  width: number;
  height: number;
  widths: readonly number[];
}

export interface Shots {
  /** When they were taken, YYYY-MM-DD. */
  takenOn: string;
  tools: Record<string, Partial<Record<ShotKind, ShotSize>>>;
}

export const SHOTS: Shots = shotsJson;

/** The files of a screenshot, by their address on the site. */
export function shotFiles(id: string, kind: ShotKind, locale: Locale): string[] {
  return (SHOTS.tools[id]?.[kind]?.widths ?? []).map((width) => `/shots/${id}-${kind}-${locale}-${width}.webp`);
}

/**
 * A tool's screenshot, in the page's language. `sizes` says how wide it is
 * shown, so the browser picks the smallest file that looks sharp.
 */
export function shotHtml(id: string, kind: ShotKind, locale: Locale, alt: string, sizes: string): Html {
  const shot = SHOTS.tools[id]?.[kind];
  if (!shot) throw new Error(`shots: no ${kind} picture of ${id}; run npm run shots`);
  const files = shotFiles(id, kind, locale);
  return html`<img class="shot" src="${files[Math.min(1, files.length - 1)]}" srcset="${files.map((file, index) => `${file} ${shot.widths[index]}w`).join(", ")}" sizes="${sizes}" width="${shot.width}" height="${shot.height}" alt="${alt}" loading="lazy" decoding="async">`;
}
