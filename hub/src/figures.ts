/**
 * The figures on the front page, worked out when the site is built, never
 * typed by hand: cookies and trackers are counted in the built pages
 * (build.ts renders again if they are not what the page says), the weight
 * is the heaviest page's, and the rest come from the data and the tool
 * list.
 */

import { costOfLiving } from "../../packages/seed-kit/src/cost-of-living.ts";
import { LOCALES } from "../../packages/seed-kit/src/locales.ts";
import { TOOLS, type Tool } from "./content.ts";

export interface Figures {
  /** Places in the built pages that could store something in the browser (document.cookie, localStorage…). */
  cookies: number;
  /** Requests to other sites the built pages would make. */
  trackers: number;
  /** The heaviest page of this site, compressed, in whole KB, rounded up. */
  maxKb: number;
  languages: number;
  /** Countries in the cost-of-living data: those the official data can price. */
  countries: number;
  /** Tools built on seed-kit that people can find and use: the shown ones, never a hidden beta. */
  tools: number;
}

/** The tools the figures count: only those the hub and the launchers show ("listed"), so a hidden beta is never counted as existing. */
export function publishedTools(tools: readonly Tool[]): number {
  return tools.filter((tool) => tool.shown).length;
}

const countries = costOfLiving.countries.length;

export function figures(measured: Pick<Figures, "cookies" | "trackers" | "maxKb">): Figures {
  return {
    ...measured,
    languages: LOCALES.length,
    countries,
    tools: publishedTools(TOOLS),
  };
}

/** The median web page on a phone, in KB (HTTP Archive, Web Almanac 2024, page weight). */
export const TYPICAL_PAGE_KB = 2311;
