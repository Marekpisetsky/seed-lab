"use client";

import { Check, Plus } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { goalName } from "@/i18n/goal-text";
import { itemName, itemPrice } from "@/i18n/item-text";
import { addGoal } from "@/lib/app-store";
import type { Goal } from "@/lib/types";
import type { Wish } from "@/lib/wishes";
import { PricesOf } from "./prices-of";
import { WishIcon } from "./wish-icon";

/** "A trip to Japan", "Live without working", or the name of a goal of the person's own. */
function wishName(wish: Wish, i18n: I18n): string {
  if (wish.own) return goalName(wish.own, i18n);
  if (wish.item) return itemName(wish.item.id, i18n);
  return i18n.m.goals.freedom;
}

/** "≈ €2,330", or what living without working costs a month. */
function wishAmount(wish: Wish, i18n: I18n): string {
  if (wish.item) return itemPrice(wish.item, i18n);
  return wish.monthly ? i18n.m.wishes.perMonth(i18n.f.eur(wish.amount)) : i18n.f.eur(wish.amount);
}

function wishIcon(wish: Wish): Parameters<typeof WishIcon>[0]["name"] {
  if (wish.item?.icon) return wish.item.icon;
  const kind = wish.own?.goal.kind ?? wish.goal?.kind;
  if (kind === "freedom") return "stop-working";
  if (kind === "live") return "abroad";
  return "own";
}

/** An example already in My goals: the same thing, or living without working at all. */
function inGoals(wish: Wish, goals: readonly Goal[]): boolean {
  if (wish.own) return true;
  const { goal } = wish;
  if (!goal) return false;
  return goals.some((added) => (goal.kind === "buy" ? added.kind === "buy" && added.item === goal.item : goal.kind === "freedom" && added.kind === "freedom"));
}

function WishChip({ wish, chosen }: { wish: Wish; chosen: boolean }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const name = wishName(wish, i18n);
  const when = f.when(wish.months);
  const amount = wishAmount(wish, i18n);
  return (
    <button
      type="button"
      aria-label={(chosen ? m.wishes.added : m.wishes.add)(name, when, amount)}
      aria-disabled={chosen || undefined}
      onClick={() => !chosen && wish.goal && addGoal(wish.goal)}
      className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-left text-base ${
        chosen ? "border-positive/40 bg-positive/10" : "border-border bg-card hover:border-accent"
      }`}
    >
      <WishIcon name={wishIcon(wish)} className="size-5 shrink-0 text-accent" />
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
 * Under the big number: "With this you could:" and up to three wishes,
 * each with its price and when the plan gets there: the person's own
 * priorities first, then examples to discover (a trip, a home, time),
 * which a tap adds to My goals. Beside it, small, the country whose prices
 * they use (lib/wishes.ts, lib/wish-country.ts). No "?" of its own: the
 * big number keeps the result's only one, and How it works tells how the
 * examples are chosen.
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
          <li key={wish.key} className="max-w-full">
            <WishChip wish={wish} chosen={inGoals(wish, state.plan.goals)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
