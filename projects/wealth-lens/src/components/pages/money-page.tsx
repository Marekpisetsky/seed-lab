import { MoneyModule } from "@/components/money/money-module";
import { Site } from "@/components/site/site";
import { getI18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";

export function MoneyPage({ locale }: { locale: Locale }) {
  return (
    <Site locale={locale}>
      <h1 className="sr-only">{getI18n(locale).m.money.title}</h1>
      <MoneyModule />
    </Site>
  );
}
