import { Card } from "@/components/ui/card";
import { Gain } from "@/components/ui/gain";
import type { CurrencySummary } from "@/lib/finance";
import { formatMoney } from "@/lib/format";

interface GainsSummaryProps {
  summaries: readonly CurrencySummary[];
}

/** "How much have I really gained?" — one block per currency, never mixed. */
export function GainsSummary({ summaries }: GainsSummaryProps) {
  return (
    <Card
      title="Your real gain"
      description={
        summaries.length > 1
          ? "Totals are shown per currency: amounts in different currencies are never added together."
          : "Current value minus what you actually paid."
      }
    >
      {summaries.length === 0 ? (
        <p className="text-sm text-muted">Add your holdings below to see how much you have gained.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {summaries.map((summary) => (
            <CurrencyBlock key={summary.currency} summary={summary} />
          ))}
        </div>
      )}
    </Card>
  );
}

function CurrencyBlock({ summary }: { summary: CurrencySummary }) {
  const { currency, holdingCount, pricedCount, costBasis, value, gain } = summary;
  const unpriced = holdingCount - pricedCount;
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {currency} · {holdingCount} holding{holdingCount === 1 ? "" : "s"}
      </p>
      {pricedCount === 0 ? (
        <p className="mt-2 text-sm text-muted">Enter current prices to see the gain.</p>
      ) : (
        <>
          <Gain gain={gain} currency={currency} className="mt-1 block text-2xl font-semibold" />
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">Current value</dt>
            <dd className="text-right tabular-nums">{formatMoney(value, currency)}</dd>
            <dt className="text-muted">Paid</dt>
            <dd className="text-right tabular-nums">{formatMoney(costBasis, currency)}</dd>
          </dl>
        </>
      )}
      {unpriced > 0 && pricedCount > 0 && (
        <p className="mt-2 text-xs text-muted">
          {unpriced} holding{unpriced === 1 ? " has" : "s have"} no current price and {unpriced === 1 ? "is" : "are"} not
          included.
        </p>
      )}
    </div>
  );
}
