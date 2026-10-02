/**
 * The figures on the front page, worked out when the site is built, never
 * typed by hand: cookies and trackers are counted in the built pages
 * (build.ts renders again if they are not what the page says), the weight
 * is the heaviest page's, and the rest come from the data and the tool
 * list.
 */

import costOfLiving from "../../projects/wealth-lens/src/data/cost-of-living.json" with { type: "json" };
import estimatedCountries from "../../projects/wealth-lens/src/data/estimated-countries.json" with { type: "json" };
import { LOCALES } from "../../packages/seed-kit/src/locales.ts";
import { TOOLS } from "./content.ts";

export interface Figures {
  /** Places in the built pages that could store something in the browser (document.cookie, localStorage…). */
  cookies: number;
  /** Requests to other sites the built pages would make. */
  trackers: number;
  /** The heaviest page of this site, compressed, in whole KB, rounded up. */
  maxKb: number;
  languages: number;
  /** Countries in the cost-of-living data: the detailed ones and the estimated ones. */
  countries: number;
  /** Tools built on seed-kit and published (live or beta). */
  tools: number;
}

const countries = new Set([...costOfLiving.countries, ...estimatedCountries.countries].map((country) => country.code)).size;

export function figures(measured: Pick<Figures, "cookies" | "trackers" | "maxKb">): Figures {
  return {
    ...measured,
    languages: LOCALES.length,
    countries,
    tools: TOOLS.filter((tool) => tool.status !== "coming").length,
  };
}

/** The median web page on a phone, in KB (HTTP Archive, Web Almanac 2024, page weight). */
export const TYPICAL_PAGE_KB = 2311;
