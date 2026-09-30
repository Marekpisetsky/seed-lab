import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./locales";

/** The [lang] of an address; anything else is not a page (dynamicParams is off, so it never gets here). */
export function asLocale(lang: string): Locale {
  if (!isLocale(lang)) notFound();
  return lang;
}
