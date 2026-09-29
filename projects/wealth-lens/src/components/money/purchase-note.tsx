import { formatEur, formatEurRounded, formatYears } from "@/lib/format";
import { lowerFirst, type PurchaseImpact } from "@/lib/report";

/** What buying the mission's item does to the money, and how much later stopping work comes. */
export function PurchaseNote({ purchase, monthly, name }: { purchase: PurchaseImpact; monthly: number; name: string }) {
  const { milestone } = purchase;
  return (
    <div className="space-y-1 rounded-lg bg-accent/10 p-3 text-sm">
      <p>
        {purchase.buyMonths === 0
          ? `Buying it now leaves ${formatEur(purchase.after)} invested, from ${formatEur(purchase.before)}.`
          : `Buying it in ${formatYears(purchase.buyMonths)} takes your investments to ${formatEur(purchase.after)}; your ${formatEur(monthly)} a month starts again.`}
      </p>
      {milestone && purchase.delayMonths >= 1 && (
        <p>
          Stopping work comes {formatYears(purchase.delayMonths)} later. Left invested, the {formatEur(purchase.before - purchase.after)}{" "}
          for {lowerFirst(name)} would be about {formatEurRounded(purchase.forgone)} by then.
        </p>
      )}
    </div>
  );
}
