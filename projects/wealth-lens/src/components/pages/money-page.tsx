import { MoneyModule } from "@/components/money/money-module";
import { Site } from "@/components/site/site";
import { getI18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";

/** "My money": a short headline and its line above the calculator, then the questions. */
export function MoneyPage({ locale }: { locale: Locale }) {
  const { m } = getI18n(locale);
  return (
    <Site>
      <div className="mb-6 space-y-1.5 px-1 sm:mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{m.money.headline}</h1>
        <p className="text-base text-muted sm:text-lg">{m.money.support}</p>
      </div>
      <MoneyModule />
    </Site>
  );
}
