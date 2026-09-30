"use client";

import { formatPercent } from "@/lib/format";
import { COMMON_PERIOD } from "@/lib/indexes";
import { stockTerms, usesFallback, type MixModel } from "@/lib/mix";
import { POOL_SIZE } from "@/lib/normal";
import { FALLBACK_FACTOR, MIN_DATA_YEARS } from "@/lib/volatility";

/**
 * The folded "i" explanations: how the figures are worked out, for whoever
 * opens them. The only place on the screen where the technical words
 * (real, nominal, volatility, percentile) may appear, each next to its
 * plain name; the rest of the app says it without them (plain-language.test.ts).
 */

/** An "i" that folds its explanation away. */
function Explainer({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <details className={`text-xs text-muted ${className}`}>
      <summary className="cursor-pointer list-none font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="mr-1 inline-flex size-4 items-center justify-center rounded-full border border-current text-[10px]">
          i
        </span>
        {title}
      </summary>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  );
}

function Term({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>;
}

/** Under the Edit panel: how the simulations use its figures. */
export function HowTheSimulationsWork() {
  return (
    <Explainer title="How the simulations use these figures">
      <p>
        <Term>Standard figures:</Term> how much it grows a year is the average after rising prices (the &quot;real&quot; return) over {COMMON_PERIOD[0]}–
        {COMMON_PERIOD[1]}; how much it can go up or down in a normal year is the spread of its yearly returns (the volatility, one standard deviation). Each
        simulated year is one of those historical years, drawn at random (a mix draws the same year for all its parts), so the ups and downs are the ones
        that happened.
      </p>
      <p>
        <Term>Your own figures (Custom):</Term> no history describes them, so each year&apos;s growth is drawn from a normal distribution in log terms: the
        typical year grows exactly your figure, two years in three stay within ± your up-or-down figure of it, one in twenty goes beyond twice that. The draws
        come from {POOL_SIZE.toLocaleString("en-US")} evenly spaced points of it.
      </p>
      <p>
        <Term>No ups and downs (0):</Term> every year grows the same, as in a savings account; how long withdrawals last is then certain.
      </p>
      <p>
        <Term>Rising prices</Term> (inflation) only turn growth before them (the &quot;nominal&quot; return, what an account statement shows) into growth
        after them. Every amount is in today&apos;s euros.
      </p>
      <p>
        <Term>8 in 10 between the lines:</Term> the dashed lines of the chart are the 10th and 90th percentiles of the simulated paths. &quot;A bad first
        decade&quot; follows the 10th percentile for ten years, then grows at the average.
      </p>
    </Explainer>
  );
}

/** Under a mix: how it is simulated. */
export function HowThisMixWorks() {
  return (
    <Explainer title="How this mix is worked out" className="group rounded-md">
      <p>
        <Term>Growth:</Term> the weighted average of each part&apos;s growth after rising prices ({COMMON_PERIOD[0]}–{COMMON_PERIOD[1]}; a savings part, its
        rate minus rising prices).
      </p>
      <p>
        <Term>Ups and downs:</Term> 1,000 simulated paths. Each year, one historical year of {COMMON_PERIOD[0]}–{COMMON_PERIOD[1]} is drawn for every part at
        once, so stocks, bonds and gold rise and fall together as they did (2022 hit stocks and bonds alike). A savings part earns its rate every year.
      </p>
      <p>
        <Term>Weights:</Term> “Let weights drift” lets each part grow on its own (money added each month is split by the weights); “Rebalance every year” goes
        back to the weights every year.
      </p>
      <p>
        <Term>Worst year in the data:</Term> the mix&apos;s worst calendar year, back at its weights each January, over the years every part has data. Past,
        not a promise.
      </p>
      <p>The quick mixes are textbook starting points (world stocks and euro government bonds), not advice: the app shows what any weights do.</p>
    </Explainer>
  );
}

/** Under My portfolio: how it is simulated, with each stock's figures. */
export function HowMyPortfolioWorks({ model }: { model: MixModel | null }) {
  const stocks = model ? stockTerms(model) : [];
  return (
    <Explainer title="How My portfolio is worked out">
      <p>
        Each holding grows like the asset beside it, weighted by its value in euros (holdings in other currencies are left out: no conversion). A stock grows
        at its index&apos;s average: one company&apos;s own past is never projected.
      </p>
      <p>
        A stock of the list keeps its own ups and downs: it goes up and down as much as its daily closes show (its volatility) and follows its index as much as
        its weekly prices did.{" "}
        {model && usesFallback(model) && (
          <>
            With under {MIN_DATA_YEARS} years of prices it is taken to move {FALLBACK_FACTOR} times as much as its index.
          </>
        )}
      </p>
      {stocks.length > 0 && (
        <ul className="space-y-0.5">
          {stocks.map((term) => (
            <li key={term.name}>
              {term.name}: can move ±{formatPercent(term.volatility, { decimals: 0 })} in a year, correlation {term.correlation.toFixed(2)} with its index.
            </li>
          ))}
        </ul>
      )}
      <p>The holdings are simulated together and left to drift, as holdings do.</p>
    </Explainer>
  );
}
