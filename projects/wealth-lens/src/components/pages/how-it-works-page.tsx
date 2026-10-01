import { PageHeader } from "@/components/page-header";
import { Site } from "@/components/site/site";
import { Marked } from "@/components/ui/marked";
import { getI18n, type I18n } from "@/i18n";
import { countryName } from "@/i18n/countries";
import { LOCALE_SETTINGS, type Locale } from "@/i18n/locales";
import type { HowItWorksFacts } from "@/i18n/page-types";
import { costOfLiving, ESTIMATE_EXCLUDED, ESTIMATE_METHOD } from "@/lib/cost-of-living";
import { COMMON_PERIOD } from "@/lib/indexes";
import { Prose } from "./prose";

/** What the page quotes from the data itself, so it never goes out of date. */
function facts(i18n: I18n): HowItWorksFacts {
  const { f } = i18n;
  const list = new Intl.ListFormat(LOCALE_SETTINGS[i18n.locale].intl, { type: "conjunction" });
  const names = (codes: string[]) => list.format(codes.map((code) => countryName(code, i18n)).sort((a, b) => a.localeCompare(b, LOCALE_SETTINGS[i18n.locale].intl)));
  const pct = (value: number) => f.percent(value, { decimals: 0 });
  const estimated = costOfLiving.countries.filter((country) => country.method === "estimated");
  return {
    period: `${COMMON_PERIOD[0]}–${COMMON_PERIOD[1]}`,
    countries: costOfLiving.countries.length,
    detailed: costOfLiving.countries.length - estimated.length,
    estimated: estimated.length,
    medianWithout: pct(ESTIMATE_METHOD.medianError.withoutRent),
    medianWith: pct(ESTIMATE_METHOD.medianError.withRent),
    tenthWithout: pct(ESTIMATE_METHOD.oneInTenOffBy.withoutRent),
    tenthWith: pct(ESTIMATE_METHOD.oneInTenOffBy.withRent),
    leftOut: names(ESTIMATE_EXCLUDED.filter((left) => /prices rose/.test(left.reason)).map((left) => left.code)),
    highInflation: names(costOfLiving.countries.filter((country) => country.inflation.recentAverage !== undefined).map((country) => country.code)),
    priceYear: Math.max(...estimated.map((country) => country.priceLevel?.year ?? 0)),
  };
}

/** How it works: the method, the assumptions, every source with its link and date, and the data licenses. */
export function HowItWorksPage({ locale }: { locale: Locale }) {
  const i18n = getI18n(locale);
  const t = i18n.m.howItWorks;
  return (
    <Site>
      <PageHeader title={t.title} question={t.lead} />
      <div className="max-w-2xl space-y-8">
        <Prose sections={t.sections(facts(i18n))} />
        <section aria-labelledby="sources-title" className="space-y-3">
          <h2 id="sources-title" className="text-lg font-bold">
            {t.sourcesTitle}
          </h2>
          <p>{t.sourcesIntro}</p>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {t.sources.map((source) => (
              <li key={source.name} className="space-y-0.5 p-3 text-sm">
                <p className="font-semibold">{source.name}</p>
                <p>{source.what}</p>
                <p className="text-muted">
                  {t.source.date}: {source.date}. {t.source.terms}: {source.terms}
                </p>
                <p>
                  <a href={source.url} rel="noopener" className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-2">
                    {t.source.link}
                    <span className="sr-only">: {source.name}</span>
                  </a>
                </p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">{t.thingsNote}</p>
        </section>
        <section aria-labelledby="licenses-title" className="space-y-2">
          <h2 id="licenses-title" className="text-lg font-bold">
            {t.licensesTitle}
          </h2>
          {t.licenses.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              <Marked text={paragraph} />
            </p>
          ))}
        </section>
      </div>
    </Site>
  );
}
