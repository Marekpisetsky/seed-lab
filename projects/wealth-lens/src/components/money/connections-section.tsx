"use client";

import { Check, House, Pin, Plus, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, LiveNumberInput } from "@/components/ui/form";
import { updatePlan } from "@/lib/app-store";
import { costOfLiving, countryInSentence } from "@/lib/cost-of-living";
import { formatEur, formatEurRounded, formatYears } from "@/lib/format";
import { createId } from "@/lib/id";
import { lowerFirst, withinReach, type ConnectionStatus, type PurchaseImpact, type Report } from "@/lib/report";
import type { Plan } from "@/lib/types";

/** Rows shown before "Show all". */
const VISIBLE = 6;

const byTime = (a: ConnectionStatus, b: ConnectionStatus) => a.months - b.months || a.target - b.target;

function StatusText({ months }: { months: number }) {
  if (months === 0) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-positive">
        <Check aria-hidden="true" className="size-4" />
        now
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap text-sm text-muted">
      {withinReach(months) ? `in ${formatYears(months)}` : "not at this pace"}
    </span>
  );
}

function Row({ status, pinnedId }: { status: ConnectionStatus; pinnedId: string | null }) {
  const { connection, months } = status;
  const pinned = connection.id === pinnedId;
  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        aria-pressed={pinned}
        onClick={() => updatePlan({ pinned: pinned ? null : connection.id })}
        className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-border/40 ${
          pinned ? "bg-accent/10 ring-1 ring-accent" : ""
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {pinned && <Pin aria-label="Your goal" className="size-3.5 shrink-0 text-accent" />}
            {connection.name}
          </span>
          <span className="block text-xs text-muted">
            {connection.kind === "live" ? `${formatEur(connection.amount)} a month` : formatEur(connection.amount)}
          </span>
        </span>
        <StatusText months={months} />
      </button>
      {connection.group === "custom" && (
        <button
          type="button"
          aria-label={`Remove ${connection.name}`}
          onClick={() =>
            updatePlan((plan) => ({
              customConnections: plan.customConnections.filter((item) => `custom:${item.id}` !== connection.id),
              pinned: plan.pinned === connection.id ? null : plan.pinned,
            }))
          }
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-border/40"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </li>
  );
}

function Group({
  title,
  icon,
  statuses,
  pinnedId,
  className,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  statuses: ConnectionStatus[];
  pinnedId: string | null;
  className: string;
  children?: React.ReactNode;
}) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...statuses].sort(byTime);
  // The pinned one is always in view.
  const pinned = sorted.find((status) => status.connection.id === pinnedId);
  const first = sorted.slice(0, VISIBLE);
  if (pinned && !first.includes(pinned)) first.unshift(pinned);
  const rest = sorted.filter((status) => !first.includes(status));
  return (
    <div className={`rounded-xl p-3 ${className}`}>
      <h3 className="mb-1 flex items-center gap-2 px-2 text-base font-semibold">
        {icon}
        {title}
      </h3>
      {children}
      <ul>
        {first.map((status) => (
          <Row key={status.connection.id} status={status} pinnedId={pinnedId} />
        ))}
      </ul>
      {rest.length > 0 && (
        <>
          {/* Rendered only when open, so typing a number does not redraw rows nobody sees. */}
          {showAll && (
            <ul>
              {rest.map((status) => (
                <Row key={status.connection.id} status={status} pinnedId={pinnedId} />
              ))}
            </ul>
          )}
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll(!showAll)}
            className="px-2 py-2 text-sm font-medium text-accent"
          >
            {showAll ? "Show fewer" : `Show all ${sorted.length}`}
          </button>
        </>
      )}
    </div>
  );
}

/** What buying the pinned item does to the money and to the next living milestone. */
function PurchaseNote({ purchase, monthly, name }: { purchase: PurchaseImpact; monthly: number; name: string }) {
  if (!Number.isFinite(purchase.buyMonths)) return null;
  const { milestone } = purchase;
  return (
    <div className="mx-2 mb-2 space-y-1 rounded-lg bg-accent/10 p-3 text-sm">
      <p>
        {purchase.buyMonths === 0
          ? `Buying it now leaves ${formatEur(purchase.after)} invested, from ${formatEur(purchase.before)}.`
          : `Buying it in ${formatYears(purchase.buyMonths)} takes your investments to ${formatEur(purchase.after)}; your ${formatEur(monthly)} a month starts again.`}
      </p>
      {milestone && purchase.delayMonths >= 1 && (
        <p>
          {milestone.connection.name} comes {formatYears(purchase.delayMonths)} later. Left invested, the{" "}
          {formatEur(purchase.before - purchase.after)} for {lowerFirst(name)} would be about {formatEurRounded(purchase.forgone)}{" "}
          by then.
        </p>
      )}
    </div>
  );
}

function AddYourOwn() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [kind, setKind] = useState<"live" | "buy">("buy");
  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" className="size-4" /> Add your own
      </Button>
    );
  }
  const valid = name.trim() !== "" && amount !== null && amount > 0;
  return (
    <form
      className="space-y-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid || amount === null) return;
        const id = createId();
        updatePlan((plan) => ({
          customConnections: [...plan.customConnections, { id, name: name.trim().slice(0, 60), kind, amount }],
          pinned: `custom:${id}`,
        }));
        setOpen(false);
        setName("");
        setAmount(null);
      }}
    >
      <label className="block space-y-1 text-sm">
        <span className="font-medium">What is it?</span>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="A sailing boat" className={inputClass} />
      </label>
      <div role="radiogroup" aria-label="Kind" className="grid grid-cols-2 gap-2 text-sm">
        {(["buy", "live"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={kind === option}
            onClick={() => setKind(option)}
            className={`rounded-lg border px-3 py-2 ${kind === option ? "border-accent bg-accent/10" : "border-border"}`}
          >
            {option === "buy" ? "Costs once" : "Costs every month"}
          </button>
        ))}
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">{kind === "buy" ? "How much?" : "How much a month?"}</span>
        <LiveNumberInput value={amount} onValue={setAmount} placeholder="€ 15,000" />
      </label>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={!valid}>
          Add and make it my goal
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function PlaceSettings({ plan }: { plan: Plan }) {
  const selectClass = "rounded-md border border-border bg-background px-2 py-1 text-xs";
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
      Estimates for one person in
      <select
        aria-label="Your country"
        value={plan.homeCountry}
        onChange={(event) => updatePlan({ homeCountry: event.target.value })}
        className={selectClass}
      >
        {[...costOfLiving.countries]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((country) => (
            <option key={country.code} value={country.code}>
              {countryInSentence(country.name)}
            </option>
          ))}
      </select>
      <select
        aria-label="Housing"
        value={plan.housing}
        onChange={(event) => updatePlan({ housing: event.target.value === "own" ? "own" : "rent" })}
        className={selectClass}
      >
        <option value="rent">renting</option>
        <option value="own">owning a home</option>
      </select>
    </p>
  );
}

/** "What it means in real life": living off the money, and buying things with it. */
export function ConnectionsSection({ report }: { report: Report }) {
  const { statuses, plan, purchase, goal } = report;
  const pinnedId = goal.pinned ? goal.status.connection.id : null;
  return (
    <section aria-labelledby="connections-title" className="space-y-3">
      <h2 id="connections-title" className="text-sm font-semibold uppercase tracking-wide text-muted">
        What it means in real life
      </h2>
      <PlaceSettings plan={plan} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Group
          title="Live off it"
          icon={<House aria-hidden="true" className="size-4 text-muted" />}
          statuses={statuses.filter((status) => status.connection.kind === "live")}
          pinnedId={pinnedId}
          className="border border-border bg-card"
        />
        <Group
          title="Buy it"
          icon={<ShoppingBag aria-hidden="true" className="size-4 text-muted" />}
          statuses={statuses.filter((status) => status.connection.kind === "buy")}
          pinnedId={pinnedId}
          className="border border-dashed border-border bg-background"
        >
          {purchase && (
            <PurchaseNote purchase={purchase} monthly={plan.monthlyContribution} name={goal.status.connection.name} />
          )}
        </Group>
      </div>
      <AddYourOwn />
      <p className="text-xs text-muted">Tap one to build the report around it. Amounts are estimates in today&apos;s euros.</p>
    </section>
  );
}
