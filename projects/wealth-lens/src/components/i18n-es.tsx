"use client";

import { createI18n } from "@/i18n/make";
import { es } from "@/i18n/messages/es";
import { I18nProvider } from "./i18n";

const I18N = createI18n("es", es);

/** The Spanish pages' words: only this dictionary is in their code. */
export function SpanishWords({ children }: { children: React.ReactNode }) {
  return <I18nProvider i18n={I18N}>{children}</I18nProvider>;
}
