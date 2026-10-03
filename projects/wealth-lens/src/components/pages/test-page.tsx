import { PageHeader } from "@/components/page-header";
import { Site } from "@/components/site/site";
import { TestModule } from "@/components/test/test-module";
import { getI18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";

export function TestPage({ locale }: { locale: Locale }) {
  const { m } = getI18n(locale);
  return (
    <Site>
      <PageHeader title={m.test.headline} question={m.test.realHistory} sentence />
      <TestModule />
    </Site>
  );
}
