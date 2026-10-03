"use client";

import { Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { addGoal } from "@/lib/app-store";
import { itemStatuses, pricedItems, type Scenario } from "@/lib/calculator";
import type { Goal } from "@/lib/types";

/** The list, cheapest first: its order depends on the dataset only, never on the user's numbers. */
function useItems() {
  return useMemo(() => [...pricedItems()].sort((a, b) => a.amount - b.amount || a.id.localeCompare(b.id)), []);
}

/** The purchase list with ✓ now or when the plan gets there, each addable to My goals. */
export function Things({ scenario, goals, today }: { scenario: Scenario; goals: readonly Goal[]; today: Date }) {
  const { m, f } = useI18n();
  const t = m.things;
  const items = useItems();
  const statuses = itemStatuses(scenario, items);
  const chosen = new Set(goals.flatMap((goal) => (goal.kind === "buy" ? [goal.item] : [])));
  const [source, setSource] = useState<string | null>(null);
  return (
    <ul className="divide-y divide-border">
      {statuses.map(({ item, months }) => {
        const words = t.items[item.id] ?? { name: item.id, source: "" };
        const now = months <= 1e-9;
        return (
          <li key={item.id} className="flex flex-wrap items-start gap-x-2 py-2">
            <button
              type="button"
              aria-expanded={source === item.id}
              onClick={() => setSource(source === item.id ? null : item.id)}
              className="min-h-11 min-w-0 flex-1 rounded-md text-left hover:bg-border/30"
            >
              <span className="block text-sm">{words.name}</span>
              <span className="block text-sm text-muted">{f.eur(item.amount)}</span>
            </button>
            <span className={`shrink-0 whitespace-nowrap pt-0.5 text-sm ${now ? "font-medium text-positive" : "text-muted"}`}>
              {now && <Check aria-hidden="true" className="mr-0.5 inline size-4 align-[-3px]" />}
              <Changed value={f.when(months, today)} />
            </span>
            {chosen.has(item.id) ? (
              // Said in words, not in a tooltip: a finger cannot hover.
              <span className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-positive">
                <Check aria-hidden="true" className="size-4" />
                <span aria-hidden="true">{t.inGoals}</span>
                <span className="sr-only">{t.isInGoals(words.name)}</span>
              </span>
            ) : (
              <button
                type="button"
                aria-label={t.add(words.name)}
                onClick={() => addGoal({ kind: "buy", item: item.id })}
                className="flex size-11 shrink-0 items-center justify-center rounded-md text-accent hover:bg-accent/10"
              >
                <Plus aria-hidden="true" className="size-4" />
              </button>
            )}
            {source === item.id && (
              <p className="mt-1 w-full rounded-md bg-background px-3 py-2 text-sm text-muted">
                {words.source} ({item.referenceDate})
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
