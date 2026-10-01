import { PageHeader } from "@/components/page-header";
import { Site } from "@/components/site/site";
import { getI18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { Prose } from "./prose";

export type InfoPageId = "about" | "privacy" | "terms";

/** About, Privacy and Terms: a title, a short lead or the date, and the sections. */
export function InfoPage({ locale, page }: { locale: Locale; page: InfoPageId }) {
  const { m } = getI18n(locale);
  const content = m[page];
  return (
    <Site>
      <PageHeader title={content.title} question={"lead" in content ? content.lead : content.updated} />
      <Prose sections={content.sections} />
    </Site>
  );
}
