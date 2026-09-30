"use client";

import { useI18n } from "@/components/i18n";
import { COMMON_PERIOD } from "@/lib/indexes";
import { stockTerms, usesFallback, type MixModel } from "@/lib/mix";
import { FALLBACK_FACTOR, MIN_DATA_YEARS } from "@/lib/volatility";

/**
 * The folded "i" explanations: how the figures are worked out, for whoever
 * opens them (texts: `explain` in the dictionaries). The only place where
 * the technical words (real, nominal, volatility, percentile) may appear,
 * each next to its plain name; the rest of the app says it without them
 * (plain-language.test.ts).
 */

const PERIOD = `${COMMON_PERIOD[0]}–${COMMON_PERIOD[1]}`;
const withPeriod = (text: string) => text.replace("{period}", PERIOD);

/** An "i" that folds its explanation away. */
function Explainer({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <details className={`text-xs text-muted ${className}`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="mr-1 inline-flex size-4 items-center justify-center rounded-full border border-current text-[10px]">
          i
        </span>
        {title}
      </summary>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  );
}

/** Under the Edit panel: how the simulations use its figures. */
export function HowTheSimulationsWork() {
  const { simulations } = useI18n().m.explain;
  return (
    <Explainer title={simulations.title}>
      <p>{withPeriod(simulations.standard)}</p>
      <p>{simulations.custom}</p>
      <p>{simulations.fixed}</p>
      <p>{simulations.prices}</p>
      <p>{simulations.lines}</p>
    </Explainer>
  );
}

/** Under a mix: how it is simulated. */
export function HowThisMixWorks() {
  const { mix } = useI18n().m.explain;
  return (
    <Explainer title={mix.title} className="group rounded-md">
      <p>{withPeriod(mix.growth)}</p>
      <p>{withPeriod(mix.ups)}</p>
      <p>{mix.weights}</p>
      <p>{mix.worst}</p>
      <p>{mix.advice}</p>
    </Explainer>
  );
}

/** Under My portfolio: how it is simulated, with each stock's figures. */
export function HowMyPortfolioWorks({ model }: { model: MixModel | null }) {
  const { m, f } = useI18n();
  const { portfolio } = m.explain;
  const stocks = model ? stockTerms(model) : [];
  return (
    <Explainer title={portfolio.title}>
      <p>{portfolio.weighting}</p>
      <p>{portfolio.stocks}</p>
      <p>
        {portfolio.own} {model && usesFallback(model) && portfolio.fallback(MIN_DATA_YEARS, FALLBACK_FACTOR)}
      </p>
      {stocks.length > 0 && (
        <ul className="space-y-0.5">
          {stocks.map((term) => (
            <li key={term.name}>{portfolio.term(term.name, f.percent(term.volatility, { decimals: 0 }), f.number(term.correlation, 2))}</li>
          ))}
        </ul>
      )}
      <p>{portfolio.drift}</p>
    </Explainer>
  );
}
