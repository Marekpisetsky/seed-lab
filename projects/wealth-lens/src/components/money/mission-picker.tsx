"use client";

import { Plane, ShoppingBag, Target, TreePalm, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, LiveNumberInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { updatePlan } from "@/lib/app-store";
import { allConnections } from "@/lib/connections";
import { formatEur } from "@/lib/format";
import type { Mission } from "@/lib/types";
import { MAX_AMOUNT } from "@/lib/validation";
import { PlaceSettings } from "./place-settings";

type Choice = "stop-working" | "abroad" | "buy" | "amount";

const CHOICES: { id: Choice; icon: LucideIcon; title: string; detail: string }[] = [
  { id: "stop-working", icon: TreePalm, title: "Stop working", detail: "Live off your investments where you live" },
  { id: "abroad", icon: Plane, title: "Live somewhere else", detail: "Choose a country" },
  { id: "buy", icon: ShoppingBag, title: "Buy something", detail: "A car, a home, a year off, or your own" },
  { id: "amount", icon: Target, title: "Reach an amount", detail: "A figure of your own" },
];

const choiceOf = (mission: Mission | null): Choice | null => {
  if (!mission) return null;
  if (mission.kind === "live-abroad") return "abroad";
  if (mission.kind === "buy-own") return "buy";
  return mission.kind;
};

const selectClass = inputClass;
const validAmount = (amount: number | null): amount is number => amount !== null && amount > 0 && amount <= MAX_AMOUNT;

/**
 * "What do you want your money to do?": four big choices. Only the user sets
 * the mission here; nothing else in the app ever picks or changes it.
 * `onDone` runs once a mission is set (to close it when changing).
 */
export function MissionPicker({ onDone, onReach }: { onDone?: () => void; onReach?: () => void }) {
  const { plan } = useAppState();
  const current = plan.mission;
  const [open, setOpen] = useState<Choice | null>(() => (current?.kind === "stop-working" ? null : choiceOf(current)));
  const connections = useMemo(
    () => allConnections({ homeCountry: plan.homeCountry, housing: plan.housing, custom: [] }),
    [plan.homeCountry, plan.housing],
  );

  const choose = (mission: Mission) => {
    updatePlan({ mission });
    onDone?.();
  };

  return (
    <section aria-labelledby="mission-question" className="space-y-4" onPointerDownCapture={onReach} onFocusCapture={onReach}>
      <h2 id="mission-question" className="text-2xl font-semibold leading-snug tracking-tight">
        What do you want your money to do?
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {CHOICES.map(({ id, icon: Icon, title, detail }) => {
          const isCurrent = choiceOf(current) === id;
          const highlighted = open === id || (open === null && isCurrent);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isCurrent}
              aria-expanded={id === "stop-working" ? undefined : open === id}
              onClick={() => (id === "stop-working" ? choose({ kind: "stop-working" }) : setOpen(open === id ? null : id))}
              className={`flex min-h-32 flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                highlighted ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent"
              }`}
            >
              <Icon aria-hidden="true" className="size-6 text-accent" />
              <span className="text-base font-semibold leading-tight">{title}</span>
              <span className="text-xs text-muted">{detail}</span>
            </button>
          );
        })}
      </div>

      {open === "abroad" && (
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Which country?</span>
          <select
            className={selectClass}
            value={current?.kind === "live-abroad" ? current.country : ""}
            onChange={(event) => choose({ kind: "live-abroad", country: event.target.value })}
          >
            <option value="" disabled>
              Choose a country
            </option>
            {connections
              .filter((connection) => connection.group === "country")
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((connection) => (
                <option key={connection.id} value={connection.id.slice("country:".length)}>
                  {connection.name.replace(/^Live in /, "")} — {formatEur(connection.amount)} a month
                </option>
              ))}
          </select>
        </label>
      )}

      {open === "buy" && <BuyChoice current={current} buys={connections.filter((connection) => connection.group === "buy")} onChoose={choose} />}

      {open === "amount" && <AmountChoice current={current} onChoose={choose} />}

      <PlaceSettings plan={plan} />
    </section>
  );
}

function BuyChoice({
  current,
  buys,
  onChoose,
}: {
  current: Mission | null;
  buys: { id: string; name: string; amount: number }[];
  onChoose: (mission: Mission) => void;
}) {
  const own = current?.kind === "buy-own" ? current : null;
  const [name, setName] = useState(own?.name ?? "");
  const [amount, setAmount] = useState<number | null>(own?.amount ?? null);
  const valid = name.trim() !== "" && validAmount(amount);
  return (
    <div className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">What?</span>
        <select
          className={selectClass}
          value={current?.kind === "buy" ? current.item : ""}
          onChange={(event) => onChoose({ kind: "buy", item: event.target.value })}
        >
          <option value="" disabled>
            Choose something
          </option>
          {[...buys]
            .sort((a, b) => a.amount - b.amount)
            .map((item) => (
              <option key={item.id} value={item.id.slice("buy:".length)}>
                {item.name} — {formatEur(item.amount)}
              </option>
            ))}
        </select>
      </label>
      <form
        className="space-y-2 rounded-lg border border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onChoose({ kind: "buy-own", name: name.trim().slice(0, 60), amount });
        }}
      >
        <p className="text-sm font-medium">Or something of your own</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            aria-label="What it is"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            placeholder="A sailing boat"
            className={inputClass}
          />
          <LiveNumberInput aria-label="Its price in euros" value={amount} onValue={setAmount} placeholder="€ price" />
        </div>
        <Button type="submit" variant="primary" disabled={!valid}>
          Make it my mission
        </Button>
      </form>
    </div>
  );
}

function AmountChoice({ current, onChoose }: { current: Mission | null; onChoose: (mission: Mission) => void }) {
  const [amount, setAmount] = useState<number | null>(current?.kind === "amount" ? current.amount : null);
  const valid = validAmount(amount);
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onChoose({ kind: "amount", amount });
      }}
    >
      <label className="block flex-1 space-y-1 text-sm">
        <span className="font-medium">How much?</span>
        <LiveNumberInput value={amount} onValue={setAmount} placeholder="€ amount" />
      </label>
      <Button type="submit" variant="primary" disabled={!valid}>
        Make it my mission
      </Button>
    </form>
  );
}
