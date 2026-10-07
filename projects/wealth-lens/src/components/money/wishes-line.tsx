"use client";

import { Check, Plus } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { countryInSentence } from "@/i18n/countries";
import { itemName, itemPrice } from "@/i18n/item-text";
import { addGoal } from "@/lib/app-store";
import type { Goal } from "@/lib/types";
import type { Wish } from "@/lib/wishes";
import { PricesOf } from "./prices-of";
import { WishIcon } from "./wish-icon";

/** "A trip to Japan", "Stop working", "Live in Portugal". */
function wishName(wish: Wish, i18n: I18n): string {
  if (wish.item) return itemName(wish.item.id, i18n);
  const { goal } = wish;
  if (goal.kind !== "live") return "";
  return goal.stopWorking ? i18n.m.wishes.stopWorking : i18n.m.goals.live(countryInSentence(goal.country, i18n));
}

/** "≈ €2,330", or what a life somewhere costs a month. */
function wishAmount(wish: Wish, i18n: I18n): string {
  return wish.item ? itemPrice(wish.item, i18n) : i18n.m.wishes.perMonth(i18n.f.eur(wish.amount));
}

/** Already in My goals: the same thing, or living in the same country with housing. */
function inGoals(wish: Wish, goals: readonly Goal[]): boolean {
  const { goal } = wish;
  return goals.some((added) =>
    goal.kind === "buy" ? added.kind === "buy" && added.item === goal.item : goal.kind === "live" && added.kind === "live" && added.country === goal.country && added.housing,
  );
}

function WishChip({ wish, chosen }: { wish: Wish; chosen: boolean }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const name = wishName(wish, i18n);
  const when = f.when(wish.months);
  const amount = wishAmount(wish, i18n);
  const icon = wish.item?.icon ?? (wish.goal.kind === "live" && wish.goal.stopWorking ? "stop-working" : "abroad");
  return (
    <button
      type="button"
      aria-label={(chosen ? m.wishes.added : m.wishes.add)(name, when, amount)}
      aria-disabled={chosen || undefined}
      onClick={() => !chosen && addGoal(wish.goal)}
      className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-left text-base ${
        chosen ? "border-positive/40 bg-positive/10" : "border-border bg-card hover:border-accent"
      }`}
    >
      <WishIcon name={icon} className="size-5 shrink-0 text-accent" />
      <span className="min-w-0">
        <span className="font-medium">{name}</span>
        <span className="text-muted"> · </span>
        <span className="whitespace-nowrap text-sm text-muted tabular-nums">{amount}</span>
        <span className="text-muted"> · </span>
        <span className="whitespace-nowrap font-semibold tabular-nums">
          <Changed value={when} />
        </span>
      </span>
      {chosen ? <Check aria-hidden="true" className="size-4 shrink-0 text-positive" /> : <Plus aria-hidden="true" className="size-4 shrink-0 text-accent" />}
    </button>
  );
}

/**
 * Under the big number: "With this you could:" and two or three wishes
 * (a trip, something bigger, stopping work), each with its price and when
 * the plan gets there; tapping one adds it to My goals. Beside it, small,
 * the country whose prices they use (lib/wishes.ts, lib/wish-country.ts).
 * No "?" of its own: the big number keeps the result's only one, and
 * How it works tells how wishes are chosen.
 */
export function WishesLine({ bundle }: { bundle: CalculationBundle }) {
  const { m } = useI18n();
  const title = useId();
  const { wishes, wishCountry, state } = bundle;
  if (wishes.length === 0) return null;
  return (
    // Part of the big number's level, not a section of its own: a lead-in and its list, no heading.
    <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/5 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p id={title} className="text-lg font-bold">
          {m.wishes.title}
        </p>
        <PricesOf country={wishCountry} />
      </div>
      <ul aria-labelledby={title} className="flex flex-wrap gap-2">
        {wishes.map((wish) => (
          <li key={wish.horizon} className="max-w-full">
            <WishChip wish={wish} chosen={inGoals(wish, state.plan.goals)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
