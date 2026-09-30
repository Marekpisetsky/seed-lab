"use client";

import { Check, Plus, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Changed } from "@/components/ui/changed";
import { inputClass, LiveNumberInput } from "@/components/ui/form";
import { addGoal, removeGoal } from "@/lib/app-store";
import { NEEDED_WITHIN_YEARS, pricedItems, whenText, type GoalStatus } from "@/lib/calculator";
import { costOfLiving, countryInSentence } from "@/lib/cost-of-living";
import { formatEur } from "@/lib/format";
import type { NewGoal } from "@/lib/types";
import { MAX_AMOUNT } from "@/lib/validation";

function amountLine(status: GoalStatus): string {
  if (!status.known) return "";
  if (status.kind === "once") return formatEur(status.amount);
  return `${formatEur(status.amount)} a month · ${formatEur(status.target)} needed`;
}

function GoalRow({ status, today }: { status: GoalStatus; today: Date }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  const reached = status.months === 0;
  return (
    <li className="py-2">
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen(!open)}
          className="min-h-11 min-w-0 flex-1 rounded-md px-1 py-1 text-left hover:bg-border/30"
        >
          <span className="block text-sm font-medium">
            {status.name}
            {status.detail && <span className="font-normal text-muted"> · {status.detail}</span>}
          </span>
          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm">
            {status.known && (
              <span className={reached ? "whitespace-nowrap font-medium text-positive" : status.reachable ? "whitespace-nowrap font-medium" : "text-muted"}>
                {reached && <Check aria-hidden="true" className="mr-0.5 inline size-4 align-[-3px]" />}
                <Changed value={status.reachable ? whenText(status.months, today) : `not at this pace — needs ${formatEur(status.needed ?? 0)}/month for ${NEEDED_WITHIN_YEARS} years`} />
              </span>
            )}
            <span className="text-xs text-muted">
              <Changed value={amountLine(status)} />
            </span>
          </span>
        </button>
        <button
          type="button"
          aria-label={`Remove ${status.name}`}
          onClick={() => removeGoal(status.goal.id)}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-border/40 hover:text-foreground"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      {open && (
        <ol id={panel} className="mt-1 space-y-1 rounded-md bg-background px-3 py-2 text-xs text-muted">
          {status.explain.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      )}
    </li>
  );
}

type Kind = "live" | "buy" | "amount" | "monthly";

const KINDS: { id: Kind; label: string }[] = [
  { id: "live", label: "Live somewhere" },
  { id: "buy", label: "Buy something" },
  { id: "amount", label: "Reach an amount" },
  { id: "monthly", label: "A monthly amount" },
];

const COUNTRIES = [...costOfLiving.countries].sort((a, b) => a.name.localeCompare(b.name));
const validAmount = (amount: number | null): amount is number => amount !== null && amount > 0 && amount <= MAX_AMOUNT;

/** The form behind "+ Add a goal": one of four kinds, each with what it needs and nothing more. */
function AddGoal({ onDone }: { onDone: () => void }) {
  const [kind, setKind] = useState<Kind | null>(null);
  const add = (goal: NewGoal) => {
    addGoal(goal);
    onDone();
  };
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <div role="radiogroup" aria-label="Kind of goal" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {KINDS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={kind === option.id}
            onClick={() => setKind(option.id)}
            className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm font-medium ${
              kind === option.id ? "border-accent bg-accent/10" : "border-border hover:border-accent"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {kind === "live" && <LiveForm onAdd={add} />}
      {kind === "buy" && <BuyForm onAdd={add} />}
      {kind === "amount" && <AmountForm onAdd={add} />}
      {kind === "monthly" && <MonthlyForm onAdd={add} />}
      <Button variant="ghost" onClick={onDone}>
        Cancel
      </Button>
    </div>
  );
}

function LiveForm({ onAdd }: { onAdd: (goal: NewGoal) => void }) {
  const [code, setCode] = useState("");
  const country = COUNTRIES.find((entry) => entry.code === code);
  return (
    <div className="space-y-2">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Where?</span>
        <select className={inputClass} value={code} onChange={(event) => setCode(event.target.value)}>
          <option value="" disabled>
            Choose a country
          </option>
          {COUNTRIES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.name}
            </option>
          ))}
        </select>
      </label>
      {country && (
        <div className="grid gap-2 sm:grid-cols-2">
          {[false, true].map((housing) => (
            <Button key={String(housing)} variant="primary" onClick={() => onAdd({ kind: "live", country: country.code, housing })}>
              <Plus aria-hidden="true" className="size-4" />
              {housing ? "With housing" : "Without housing"}:{" "}
              {formatEur(housing ? country.monthlyCostEur.withRent : country.monthlyCostEur.withoutRent)} a month
            </Button>
          ))}
          <p className="text-xs text-muted sm:col-span-2">
            One person in {countryInSentence(country.name)}, estimates ({country.referenceDate}).
          </p>
        </div>
      )}
    </div>
  );
}

function BuyForm({ onAdd }: { onAdd: (goal: NewGoal) => void }) {
  const items = useMemo(() => [...pricedItems()].sort((a, b) => a.amount - b.amount), []);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const valid = name.trim() !== "" && validAmount(amount);
  return (
    <div className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">From the list</span>
        <select className={inputClass} value="" onChange={(event) => event.target.value && onAdd({ kind: "buy", item: event.target.value })}>
          <option value="" disabled>
            Choose something
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — {formatEur(item.amount)}
            </option>
          ))}
        </select>
      </label>
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onAdd({ kind: "buy-own", name: name.trim().slice(0, 60), amount });
        }}
      >
        <p className="text-sm font-medium">Or your own</p>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="What it is" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="What" className={inputClass} />
          <LiveNumberInput aria-label="Its price in euros" value={amount} onValue={setAmount} placeholder="€ price" />
        </div>
        <Button type="submit" variant="primary" disabled={!valid}>
          <Plus aria-hidden="true" className="size-4" /> Add
        </Button>
      </form>
    </div>
  );
}

function AmountForm({ onAdd }: { onAdd: (goal: NewGoal) => void }) {
  const [amount, setAmount] = useState<number | null>(null);
  const valid = validAmount(amount);
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onAdd({ kind: "amount", amount });
      }}
    >
      <label className="block flex-1 space-y-1 text-sm">
        <span className="font-medium">How much?</span>
        <LiveNumberInput value={amount} onValue={setAmount} placeholder="€ amount" />
      </label>
      <Button type="submit" variant="primary" disabled={!valid}>
        <Plus aria-hidden="true" className="size-4" /> Add
      </Button>
    </form>
  );
}

/** A monthly amount the money should pay, with a label only if the user wants one. */
function MonthlyForm({ onAdd }: { onAdd: (goal: NewGoal) => void }) {
  const [amount, setAmount] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const valid = validAmount(amount);
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onAdd({ kind: "monthly", amount, label: label.trim() === "" ? null : label.trim().slice(0, 60) });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Amount a month</span>
          <LiveNumberInput value={amount} onValue={setAmount} placeholder="€ a month" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Label (optional)</span>
          <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={60} placeholder="e.g. my expenses" className={inputClass} />
        </label>
      </div>
      <Button type="submit" variant="primary" disabled={!valid}>
        <Plus aria-hidden="true" className="size-4" /> Add
      </Button>
    </form>
  );
}

/**
 * "My goals": none at first, only a quiet "+ Add a goal". Each goal is a
 * row that stays where it was added, with its status against the same
 * plan; tapping it shows the calculation, × removes it.
 */
export function GoalsSection({ goals, today }: { goals: readonly GoalStatus[]; today: Date }) {
  const [adding, setAdding] = useState(false);
  return (
    <section aria-labelledby={goals.length > 0 ? "goals-title" : undefined} aria-label={goals.length > 0 ? undefined : "My goals"} className="space-y-2">
      {goals.length > 0 && (
        <>
          <h2 id="goals-title" className="text-sm font-semibold uppercase tracking-wide text-muted">
            My goals
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card px-2">
            {goals.map((status) => (
              <GoalRow key={status.goal.id} status={status} today={today} />
            ))}
          </ul>
        </>
      )}
      {adding ? (
        <AddGoal onDone={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-accent/10"
        >
          <Plus aria-hidden="true" className="size-4" /> Add a goal
        </button>
      )}
    </section>
  );
}
