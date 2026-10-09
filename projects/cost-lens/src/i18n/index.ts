/**
 * The words of Horalis Cost of Living, one file per language. Dutch is
 * built but waits for a native speaker's review before it is shown
 * (seed-kit locales.ts, `pendingReview`).
 */

import type { Locale } from "../../../../packages/seed-kit/src/locales.ts";
import { en, type Words } from "./en.ts";
import { es } from "./es.ts";
import { nl } from "./nl.ts";

export type { Words };

export const WORDS: Readonly<Record<Locale, Words>> = { en, es, nl };
