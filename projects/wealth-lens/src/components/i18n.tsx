"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { readerRegion } from "@seed-kit/detect.ts";
import type { I18n } from "@/i18n";
import { createI18n } from "@/i18n/make";
import { useAppState } from "@/hooks/use-app";

const I18nContext = createContext<I18n | null>(null);

const never = () => () => {};

/**
 * Every component under it speaks `i18n`'s language, with amounts in the
 * plan's currency (More options) and numbers written the reader's way
 * (their browser's language, worked out on the device). Pages give it
 * through i18n-en.tsx, i18n-es.tsx or i18n-nl.tsx, so each page's code
 * holds only its own words.
 */
export function I18nProvider({ i18n, children }: { i18n: I18n; children: React.ReactNode }) {
  const { plan } = useAppState();
  // The static page is written in the language's own way; the reader's comes once it runs.
  const region = useSyncExternalStore(never, () => readerRegion(i18n.locale, navigator.language), () => "");
  const value = createI18n(i18n.locale, i18n.m, { region, currency: plan.currency });
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The words and formats of the page's language, in the plan's currency. */
export function useI18n(): I18n {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error("useI18n needs an I18nProvider around it");
  return i18n;
}
