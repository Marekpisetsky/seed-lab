import { PageHeader } from "@/components/page-header";
import { Site } from "@/components/site/site";
import { StocksModule } from "@/components/stocks/stocks-module";
import { getI18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";

export function StocksPage({ locale }: { locale: Locale }) {
  const { m } = getI18n(locale);
  return (
    <Site>
      <PageHeader title={m.stocks.title} question={m.stocks.question} />
      <StocksModule />
    </Site>
  );
}
