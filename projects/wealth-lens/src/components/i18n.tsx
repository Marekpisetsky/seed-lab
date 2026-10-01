"use client";

import { createContext, useContext } from "react";
import type { I18n } from "@/i18n";

const I18nContext = createContext<I18n | null>(null);

/**
 * Every component under it speaks `i18n`'s language. Pages give it through
 * i18n-en.tsx or i18n-es.tsx, so each page's code holds only its own words.
 */
export function I18nProvider({ i18n, children }: { i18n: I18n; children: React.ReactNode }) {
  return <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>;
}

/** The words and formats of the page's language. */
export function useI18n(): I18n {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error("useI18n needs an I18nProvider around it");
  return i18n;
}
