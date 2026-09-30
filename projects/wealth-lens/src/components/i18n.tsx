"use client";

import { createContext, useContext } from "react";
import { EN, getI18n, type I18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";

const I18nContext = createContext<I18n>(EN);

/** Every component under it speaks `locale`: each page gives its own (English, or the /es/ pages' Spanish). */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={getI18n(locale)}>{children}</I18nContext.Provider>;
}

/** The words and formats of the page's language. */
export function useI18n(): I18n {
  return useContext(I18nContext);
}
