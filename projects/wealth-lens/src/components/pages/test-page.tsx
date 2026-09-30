import { PageHeader } from "@/components/page-header";
import { Site } from "@/components/site/site";
import { TestModule } from "@/components/test/test-module";
import { getI18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";

export function TestPage({ locale }: { locale: Locale }) {
  const { m } = getI18n(locale);
  return (
    <Site locale={locale}>
      <PageHeader title={m.test.title} question={m.test.question} />
      <TestModule />
    </Site>
  );
}
