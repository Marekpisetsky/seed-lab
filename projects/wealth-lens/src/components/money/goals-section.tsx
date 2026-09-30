"use client";

import { Check, Plus, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Changed } from "@/components/ui/changed";
import { inputClass, LiveNumberInput } from "@/components/ui/form";
import { Help } from "@/components/ui/help";
import { RadioGroup } from "@/components/ui/radio-group";
import { byCountryName, countryInSentence, countryName, matchesCountry } from "@/i18n/countries";
import { goalDetail, goalExplain, goalName } from "@/i18n/goal-text";
import { addGoal, removeGoal } from "@/lib/app-store";
import { NEEDED_WITHIN_YEARS, pricedItems, type Calculation, type GoalStatus } from "@/lib/calculator";
import { costOfLiving } from "@/lib/cost-of-living";
import type { NewGoal } from "@/lib/types";
import { MAX_AMOUNT } from "@/lib/validation";

function GoalRow({ status, calc, today }: { status: GoalStatus; calc: Calculation; today: Date }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const [open, setOpen] = useState(false);
  const panel = useId();
  const reached = status.months <= 1e-9;
  const name = goalName(status, i18n);
  const detail = goalDetail(status, i18n);
  const amountLine = !status.known ? "" : status.kind === "once" ? f.eur(status.amount) : m.goals.perMonthNeeded(f.eur(status.amount), f.eur(status.target));
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
            {name}
            {detail && <span className="font-normal text-muted"> · {detail}</span>}
          </span>
          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm">
            {status.known && (
              <span className={reached ? "whitespace-nowrap font-medium text-positive" : status.reachable ? "whitespace-nowrap font-medium" : "text-muted"}>
                {reached && <Check aria-hidden="true" className="mr-0.5 inline size-4 align-[-3px]" />}
                <Changed value={status.reachable ? f.when(status.months, today) : m.goals.notAtThisPace(f.eur(status.needed ?? 0), NEEDED_WITHIN_YEARS)} />
              </span>
            )}
            <span className="text-xs text-muted">
              <Changed value={amountLine} />
            </span>
          </span>
        </button>
        <button
          type="button"
          aria-label={m.goals.remove(name)}
          onClick={() => removeGoal(status.goal.id)}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-border/40 hover:text-foreground"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      {open && (
        <ol id={panel} className="mt-1 space-y-1 rounded-md bg-background px-3 py-2 text-xs text-muted">
          {goalExplain(status, calc.scenario, calc.investment, i18n).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      )}
    </li>
  );
}

type Kind = "live" | "buy" | "amount" | "monthly";
const KINDS: readonly Kind[] = ["live", "buy", "amount", "monthly"];

const validAmount = (amount: number | null): amount is number => amount !== null && amount > 0 && amount <= MAX_AMOUNT;

/** The form behind "+ Add a goal": one of four kinds, each with what it needs and nothing more. */
function AddGoal({ onDone }: { onDone: () => void }) {
  const { m } = useI18n();
  const [kind, setKind] = useState<Kind | null>(null);
  const add = (goal: NewGoal) => {
    addGoal(goal);
    onDone();
  };
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <RadioGroup
        label={m.goals.kind}
        options={KINDS.map((id) => ({ value: id, label: m.goals.kinds[id] }))}
        value={kind}
        onChange={setKind}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        optionClassName={(checked) =>
          `min-h-11 rounded-lg border px-3 py-2 text-left text-sm font-medium ${checked ? "border-accent bg-accent/10" : "border-border hover:border-accent"}`
        }
      />
      {kind === "live" && <LiveForm onAdd={add} />}
      {kind === "buy" && <BuyForm onAdd={add} />}
      {kind === "amount" && <AmountForm onAdd={add} />}
      {kind === "monthly" && <MonthlyForm onAdd={add} />}
      <Button variant="ghost" onClick={onDone}>
        {m.goals.cancel}
      </Button>
    </div>
  );
}

/** Where to live: a search that narrows the list of countries, then with or without housing. */
function LiveForm({ onAdd }: { onAdd: (goal: NewGoal) => void }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.goals.form;
  const [code, setCode] = useState("");
  const [query, setQuery] = useState("");
  const countries = useMemo(() => byCountryName(costOfLiving.countries, i18n), [i18n]);
  const shown = countries.filter((entry) => matchesCountry(entry.code, query, i18n));
  const country = countries.find((entry) => entry.code === code);
  return (
    <div className="space-y-2">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">{t.where}</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className={inputClass} />
      </label>
      <select aria-label={t.chooseCountry} className={inputClass} value={code} onChange={(event) => setCode(event.target.value)}>
        <option value="" disabled>
          {t.chooseCountry}
        </option>
        {shown.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {countryName(entry.code, i18n)}
          </option>
        ))}
      </select>
      {country && (
        <div className="grid gap-2 sm:grid-cols-2">
          {[false, true].map((housing) => (
            <Button key={String(housing)} variant="primary" onClick={() => onAdd({ kind: "live", country: country.code, housing })}>
              <Plus aria-hidden="true" className="size-4" />
              {t.option(housing, f.eur(housing ? country.monthlyCostEur.withRent : country.monthlyCostEur.withoutRent))}
            </Button>
          ))}
          <p className="text-xs text-muted sm:col-span-2">
            {country.priceLevel
              ? t.onePersonEstimated(countryInSentence(country.code, i18n), country.priceLevel.year)
              : t.onePerson(countryInSentence(country.code, i18n), country.referenceDate)}
          </p>
        </div>
      )}
    </div>
  );
}

function BuyForm({ onAdd }: { onAdd: (goal: NewGoal) => void }) {
  const { m, f } = useI18n();
  const t = m.goals.form;
  const items = useMemo(() => [...pricedItems()].sort((a, b) => a.amount - b.amount), []);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const valid = name.trim() !== "" && validAmount(amount);
  return (
    <div className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">{t.fromList}</span>
        <select className={inputClass} value="" onChange={(event) => event.target.value && onAdd({ kind: "buy", item: event.target.value })}>
          <option value="" disabled>
            {t.chooseThing}
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {t.thingOption(m.things.items[item.id]?.name ?? item.id, f.eur(item.amount))}
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
        <p className="text-sm font-medium">{t.orOwn}</p>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label={t.what} value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder={t.whatShort} className={inputClass} />
          <LiveNumberInput aria-label={t.price} value={amount} onValue={setAmount} placeholder={t.pricePlaceholder} />
        </div>
        <Button type="submit" variant="primary" disabled={!valid}>
          <Plus aria-hidden="true" className="size-4" /> {t.add}
        </Button>
      </form>
    </div>
  );
}

function AmountForm({ onAdd }: { onAdd: (goal: NewGoal) => void }) {
  const { m } = useI18n();
  const t = m.goals.form;
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
        <span className="font-medium">{t.howMuch}</span>
        <LiveNumberInput value={amount} onValue={setAmount} placeholder={t.amountPlaceholder} />
      </label>
      <Button type="submit" variant="primary" disabled={!valid}>
        <Plus aria-hidden="true" className="size-4" /> {t.add}
      </Button>
    </form>
  );
}

/** A monthly amount the money should pay, with a label only if the user wants one. */
function MonthlyForm({ onAdd }: { onAdd: (goal: NewGoal) => void }) {
  const { m } = useI18n();
  const t = m.goals.form;
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
          <span className="font-medium">{t.amountMonth}</span>
          <LiveNumberInput value={amount} onValue={setAmount} placeholder={t.amountMonthPlaceholder} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">{t.label}</span>
          <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={60} placeholder={t.labelPlaceholder} className={inputClass} />
        </label>
      </div>
      <Button type="submit" variant="primary" disabled={!valid}>
        <Plus aria-hidden="true" className="size-4" /> {t.add}
      </Button>
    </form>
  );
}

/**
 * "My goals": none at first, only a quiet "+ Add a goal". Each goal is a
 * row that stays where it was added, with its status against the same
 * plan; tapping it shows the calculation, × removes it.
 */
export function GoalsSection({ calc, today }: { calc: Calculation; today: Date }) {
  const { m } = useI18n();
  const [adding, setAdding] = useState(false);
  const { goals } = calc;
  return (
    <section aria-labelledby={goals.length > 0 ? "goals-title" : undefined} aria-label={goals.length > 0 ? undefined : m.goals.title} className="space-y-2">
      {goals.length > 0 && (
        <>
          <h2 id="goals-title" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            {m.goals.title}
            <Help what={m.goals.title} text={m.help.goals} />
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card px-2">
            {goals.map((status) => (
              <GoalRow key={status.goal.id} status={status} calc={calc} today={today} />
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
          <Plus aria-hidden="true" className="size-4" /> {m.goals.add}
        </button>
      )}
    </section>
  );
}
