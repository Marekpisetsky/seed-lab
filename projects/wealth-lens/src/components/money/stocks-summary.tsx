"use client";

import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Sparkline } from "@/components/charts/sparkline";
import { useI18n } from "@/components/i18n";
import { Gain } from "@/components/ui/gain";
import { IntentLink } from "@/components/ui/intent-link";
import { localePath, PAGES } from "@/i18n/locales";
import { stocksSummary } from "@/lib/stocks-summary";
import { BASE_CURRENCY, type Holding } from "@/lib/types";

/**
 * "My stocks today", compact, under the result, only when there are
 * holdings priced in euros: what they are worth, how that changed over the
 * last 12 months (in euros and %, with a sign and an arrow), their small
 * line, and the way to the whole page.
 */
export function StocksSummary({ holdings }: { holdings: readonly Holding[] }) {
  const { locale, m, f } = useI18n();
  const t = m.stocksSummary;
  const summary = useMemo(() => stocksSummary(holdings), [holdings]);
  if (!summary) return null;
  const { change } = summary;
  return (
    <section aria-labelledby="stocks-summary-title" className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="stocks-summary-title" className="text-lg font-bold">
          {t.title}
        </h2>
        <IntentLink href={localePath(PAGES.stocks, locale)} className="inline-flex min-h-11 items-center gap-1 text-base font-medium text-accent underline-offset-2 hover:underline">
          {t.link}
          <ArrowRight aria-hidden="true" className="size-4" />
        </IntentLink>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 tabular-nums">
          <div>
            <dt className="text-sm text-muted">{t.worth}</dt>
            <dd className="text-2xl font-bold">{f.eur(summary.worth)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t.lastYear}</dt>
            <dd className="text-lg font-semibold">
              <Gain gain={change} currency={BASE_CURRENCY} decimals={0} />
            </dd>
          </div>
        </dl>
        <span role="img" aria-label={t.aria(f.eur(change.absolute, { signed: true }))} className="flex">
          <Sparkline closes={summary.line} rising={change.absolute >= 0} />
        </span>
      </div>
      {summary.missing.length > 0 && <p className="text-sm text-muted">{t.missing(summary.missing.join(", "))}</p>}
    </section>
  );
}
