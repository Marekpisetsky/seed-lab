import { MoneyModule } from "@/components/money/money-module";
import { Site } from "@/components/site/site";
import { getI18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";

/**
 * "My money": a short headline and its line, then the steps. The headline
 * is the module's: at first it sits in the same centred column as the card.
 */
export function MoneyPage({ locale }: { locale: Locale }) {
  const { m } = getI18n(locale);
  return (
    <Site>
      <MoneyModule
        header={
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{m.money.headline}</h1>
            <p className="text-base text-muted sm:text-lg">{m.money.support}</p>
          </div>
        }
      />
    </Site>
  );
}
