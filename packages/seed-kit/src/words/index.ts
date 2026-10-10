/**
 * seed-kit's own words in every language (one file each: en.ts, es.ts,
 * nl.ts). English sets the shape; every other file must have the same.
 */

import type { LegalPage } from "../legal-types.ts";
import type { Locale } from "../locales.ts";
import * as en from "./en.ts";
import * as es from "./es.ts";
import * as nl from "./nl.ts";

export interface KitWords {
  chrome: { [K in keyof typeof en.chrome]: (typeof en.chrome)[K] extends string ? string : { [T in keyof (typeof en.chrome)[K]]: string } };
  legal: (name: string) => LegalPage;
  withdrawal: { why: string };
}

export const KIT_WORDS: Readonly<Record<Locale, KitWords>> = { en, es, nl };
