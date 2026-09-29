import { Notice } from "@/components/ui/notice";
import { costOfLiving } from "@/lib/cost-of-living";
import { formatPercent } from "@/lib/format";

/** The caveats that must sit next to any FIRE result, not in a footer. */
export function FireRiskNotes({ withdrawalRate }: { withdrawalRate: number }) {
  return (
    <Notice tone="warning" title="Read this before trusting the result">
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>The 4% rule is not a guarantee.</strong> It comes from historical US stock and bond returns over
          30-year retirements. Longer retirements, other markets and future returns may not support{" "}
          {formatPercent(withdrawalRate)} a year.
        </li>
        <li>
          <strong>Sequence of returns:</strong> a crash in the first years of withdrawals can drain a portfolio that
          would have survived the same average return in a different order.
        </li>
        <li>
          <strong>Currency risk:</strong> if you spend in a currency other than the one your portfolio is in,
          exchange-rate moves change what your income buys.
        </li>
        <li>
          <strong>Local inflation</strong> can run higher than in the markets your returns come from, and the costs
          below are today&apos;s prices.
        </li>
      </ul>
    </Notice>
  );
}

/** States what the cost figures are: estimates, with their sources and date. */
export function DatasetNote() {
  const { conversion, compiledOn } = costOfLiving;
  return (
    <p className="text-xs text-muted">
      <strong className="font-medium text-foreground">Approximate estimates, not live data.</strong> One person, per
      month, country averages (cities vary a lot). Without rent: Numbeo; rent: Wise, 1-bedroom outside the city
      centre. Compiled {compiledOn}; USD and GBP converted at {conversion.usdPerEur} USD/EUR and{" "}
      {conversion.gbpPerEur} GBP/EUR ({conversion.rateDate}).
    </p>
  );
}

/** Per-country sources, collapsed by default. */
export function DatasetSources() {
  return (
    <details className="text-xs text-muted">
      <summary className="cursor-pointer font-medium text-foreground">Sources for each country</summary>
      <ul className="mt-2 space-y-1">
        {costOfLiving.countries.map((country) => (
          <li key={country.code}>
            <span className="font-medium text-foreground">{country.name}</span> ({country.referenceDate}):{" "}
            {country.source}
          </li>
        ))}
      </ul>
    </details>
  );
}
