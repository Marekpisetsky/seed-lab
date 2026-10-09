import { en } from "./en.ts";
import { es } from "./es.ts";
import { nl } from "./nl.ts";
import type { Messages } from "./en.ts";
import type { Locale } from "./locales.ts";

export type { Messages };
export * from "./locales.ts";

const MESSAGES: Readonly<Record<Locale, Messages>> = { en, es, nl };

export function messages(locale: Locale): Messages {
  return MESSAGES[locale];
}
