"use client";

import { createI18n } from "@/i18n/make";
import { nl } from "@/i18n/messages/nl";
import { I18nProvider } from "./i18n";

const I18N = createI18n("nl", nl);

/** The Dutch pages' words (waiting for a native speaker's review): only this dictionary is in their code. */
export function DutchWords({ children }: { children: React.ReactNode }) {
  return <I18nProvider i18n={I18N}>{children}</I18nProvider>;
}
