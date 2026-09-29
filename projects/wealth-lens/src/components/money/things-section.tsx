"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Changed } from "@/components/ui/changed";
import { addGoal } from "@/lib/app-store";
import { itemStatuses, pricedItems, whenText, type Scenario } from "@/lib/calculator";
import { formatEur } from "@/lib/format";
import type { Goal } from "@/lib/types";

/** The list, cheapest first: its order depends on the dataset only, never on the user's numbers. */
function useItems() {
  return useMemo(() => [...pricedItems()].sort((a, b) => a.amount - b.amount || a.name.localeCompare(b.name)), []);
}

function Things({ scenario, goals }: { scenario: Scenario; goals: readonly Goal[] }) {
  const items = useItems();
  const statuses = itemStatuses(scenario, items);
  const chosen = new Set(goals.flatMap((goal) => (goal.kind === "buy" ? [goal.item] : [])));
  const [source, setSource] = useState<string | null>(null);
  return (
    <ul className="divide-y divide-border">
      {statuses.map(({ item, months }) => (
        <li key={item.id} className="flex flex-wrap items-start gap-x-2 py-2">
          <button
            type="button"
            aria-expanded={source === item.id}
            onClick={() => setSource(source === item.id ? null : item.id)}
            className="min-w-0 flex-1 rounded-md text-left hover:bg-border/30"
          >
            <span className="block text-sm">{item.name}</span>
            <span className="block text-xs text-muted">{formatEur(item.amount)}</span>
          </button>
          <span className={`shrink-0 whitespace-nowrap pt-0.5 text-sm ${months === 0 ? "font-medium text-positive" : "text-muted"}`}>
            {months === 0 && <Check aria-hidden="true" className="mr-0.5 inline size-4 align-[-3px]" />}
            <Changed value={whenText(months)} />
          </span>
          {chosen.has(item.id) ? (
            <span className="flex size-8 shrink-0 items-center justify-center text-positive" title="In My goals">
              <Check aria-hidden="true" className="size-4" />
              <span className="sr-only">{item.name} is in My goals</span>
            </span>
          ) : (
            <button
              type="button"
              aria-label={`Add ${item.name} to My goals`}
              onClick={() => addGoal({ kind: "buy", item: item.id })}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-accent hover:bg-accent/10"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          )}
          {source === item.id && (
            <p className="mt-1 w-full rounded-md bg-background px-3 py-2 text-xs text-muted">
              {item.source} ({item.referenceDate})
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * "Things you could buy", folded: the purchase list with ✓ now or when the
 * plan gets there, each addable to My goals. Worked out when opened.
 */
export function ThingsSection({ scenario, goals }: { scenario: Scenario; goals: readonly Goal[] }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="group rounded-xl border border-border" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        Things you could buy
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-3">
        {open && <Things scenario={scenario} goals={goals} />}
        {open && <p className="pt-2 text-xs text-muted">Typical prices in today&apos;s euros: estimates. Tap one for its source.</p>}
      </div>
    </details>
  );
}
