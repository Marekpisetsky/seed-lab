import { I18nProvider } from "@/components/i18n";
import type { Locale } from "@/i18n/locales";
import { SiteShell } from "./site-shell";

/** A page of the site in one language: its words for every component inside, and the header and footer around it. */
export function Site({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <I18nProvider locale={locale}>
      <SiteShell>{children}</SiteShell>
    </I18nProvider>
  );
}
