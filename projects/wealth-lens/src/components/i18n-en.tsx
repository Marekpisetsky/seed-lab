"use client";

import { createI18n } from "@/i18n/make";
import { en } from "@/i18n/messages/en";
import { I18nProvider } from "./i18n";

const I18N = createI18n("en", en);

/** The English pages' words: only this dictionary is in their code. */
export function EnglishWords({ children }: { children: React.ReactNode }) {
  return <I18nProvider i18n={I18N}>{children}</I18nProvider>;
}
