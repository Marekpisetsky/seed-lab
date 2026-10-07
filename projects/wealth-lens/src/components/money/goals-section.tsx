"use client";

import { Check, Plus, Star, X } from "lucide-react";
import { Fragment, useId, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Changed } from "@/components/ui/changed";
import { inputClass, LiveNumberInput } from "@/components/ui/form";
import { Help } from "@/components/ui/help";
import { RadioGroup } from "@/components/ui/radio-group";
import { byCountryName, countryName, matchesCountry } from "@/i18n/countries";
import { goalDetail, goalExplain, goalName } from "@/i18n/goal-text";
import { itemName, itemPrice } from "@/i18n/item-text";
import { addGoal, removeGoal, updateGoal } from "@/lib/app-store";
import { NEEDED_WITHIN_YEARS, pricedItems, type Calculation, type GoalStatus } from "@/lib/calculator";
import { costOfLiving } from "@/lib/cost-of-living";
import type { Goal, NewGoal } from "@/lib/types";
import { MAX_AMOUNT } from "@/lib/validation";
import { PricesOf } from "./prices-of";

function GoalRow({ status, calc, today }: { status: GoalStatus; calc: Calculation; today: Date }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const [open, setOpen] = useState(false);
  const panel = useId();
  // Always with a date: ✓ "from 2031, in 5 years" within the plan's years, "in 25 years (2051)" after them.
  const reach = f.reach(status.months, calc.result.years * 12, today);
  const reached = status.reachable && reach.reached;
  const name = goalName(status, i18n);
  const detail = goalDetail(status, i18n);
  // A thing of the list keeps its "≈" when its price is a rough estimate, as everywhere else.
  const once = status.item ? itemPrice(status.item, i18n) : f.eur(status.amount);
  const amountLine = !status.known ? "" : status.kind === "once" ? once : m.goals.perMonthNeeded(f.eur(status.amount), f.eur(status.target));
  const remaining = Math.max(0, status.target - calc.scenario.capital);
  const saved = Math.min(status.target, Math.max(0, calc.scenario.capital));
  return (
    <li className="py-2">
      <div className="flex flex-wrap items-start gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen(!open)}
          className="min-h-11 min-w-0 max-w-full flex-[1_0_10rem] rounded-md px-1 py-1 text-left [overflow-wrap:anywhere] hover:bg-border/30"
        >
          <span className="block text-sm font-medium">
            {name}
            {detail && <span className="font-normal text-muted"> · {detail}</span>}
          </span>
          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm">
            {status.known && (
              <span className={reached ? "font-medium text-positive" : status.reachable ? "font-medium" : "text-muted"}>
                {reached && <Check aria-hidden="true" className="mr-0.5 inline size-4 align-[-3px]" />}
                {reached && <span className="sr-only">{m.goals.reached} </span>}
                <Changed value={status.reachable ? reach.text : m.goals.notAtThisPace(f.eur(status.needed ?? 0), NEEDED_WITHIN_YEARS)} />
              </span>
            )}
            <span className="text-sm font-medium text-muted">
              <Changed value={amountLine} />
            </span>
          </span>
        </button>
        <button type="button" aria-label={`${m.goals.important}: ${name}`} aria-pressed={status.goal.important === true}
          onClick={() => updateGoal(status.goal.id, (goal) => {
            const { important, ...rest } = goal;
            return important ? rest : { ...rest, important: true };
          })}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-accent hover:bg-accent/10">
          <Star aria-hidden="true" className="size-4" fill={status.goal.important ? "currentColor" : "none"} />
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
      {status.known && status.goal.important && (
        <div className="px-1 pb-2">
          <progress aria-label={`${m.goals.progress}: ${name}`} max={status.target} value={saved} className="goal-progress block h-2 w-full" />
          <p className="mt-1 text-sm font-medium">{m.goals.missing(f.eur(remaining))}</p>
        </div>
      )}
      {status.goal.kind === "freedom" && <p className="px-1 text-sm font-medium text-muted">{m.goals.freedomAssumption(f.rate(calc.scenario.withdrawalRate))}</p>}
      {open && (
        <div id={panel} className="mt-1 space-y-2 rounded-md bg-background px-3 py-2 text-sm text-muted">
        {status.goal.kind === "live" && (
          <label className="flex min-h-11 items-center gap-2 font-medium">
            <input type="checkbox" checked={status.goal.housing} onChange={(event) => updateGoal(status.goal.id, (goal) => goal.kind === "live" ? { ...goal, housing: event.target.checked } : goal)} />
            {m.goals.withHousing}
          </label>
        )}
        {status.goal.kind === "freedom" && <FreedomForm initial={status.goal} onAdd={(next) => updateGoal(status.goal.id, () => ({ ...next, id: status.goal.id, ...(status.goal.important ? { important: true } : {}) }))} />}
        <ol className="space-y-1">
          {goalExplain(status, calc.scenario, calc.investment, i18n).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol></div>
      )}
    </li>
  );
}

type Kind = "freedom" | "live" | "buy" | "amount" | "monthly";
const KINDS: readonly Kind[] = ["freedom", "live", "amount", "buy", "monthly"];

const validAmount = (amount: number | null): amount is number => amount !== null && amount > 0 && amount <= MAX_AMOUNT;

/** The form behind "+ Add a goal": only the fields the chosen goal needs. */
function AddGoal({ onDone, wishCountry }: { onDone: () => void; wishCountry: string }) {
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
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        optionClassName={(checked) =>
          `min-h-11 rounded-lg border px-3 py-2 text-left text-sm font-medium ${checked ? "border-accent bg-accent/10" : "border-border hover:border-accent"}`
        }
      />
      {kind === "freedom" && <FreedomForm onAdd={add} />}
      {kind === "live" && <LiveForm onAdd={add} />}
      {kind === "buy" && <BuyForm onAdd={add} country={wishCountry} />}
      {kind === "amount" && <AmountForm onAdd={add} />}
      {kind === "monthly" && <MonthlyForm onAdd={add} />}
      <Button variant="ghost" onClick={onDone}>
        {m.goals.cancel}
      </Button>
    </div>
  );
}

/** Country selection gives an immediate answer; rent remains editable in the goal. */
function LiveForm({ onAdd }: { onAdd: (goal: NewGoal) => void }) {
  const i18n = useI18n();
  const { m } = i18n;
  const t = m.goals.form;
  const [query, setQuery] = useState("");
  const countries = useMemo(() => byCountryName(costOfLiving.countries, i18n), [i18n]);
  const shown = countries.filter((entry) => matchesCountry(entry.code, query, i18n));
  return (
    <div className="space-y-2">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">{t.where}</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className={inputClass} />
      </label>
      <select aria-label={t.chooseCountry} className={inputClass} value="" onChange={(event) => onAdd({ kind: "live", country: event.target.value, housing: true })}>
        <option value="" disabled>
          {t.chooseCountry}
        </option>
        {shown.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {countryName(entry.code, i18n)}
          </option>
        ))}
      </select>
      <p className="text-sm font-medium text-muted">{t.includesRent}</p>
    </div>
  );
}

/** Personal expenses first; selecting a country only fills an editable estimate. */
function FreedomForm({ onAdd, initial }: { onAdd: (goal: NewGoal) => void; initial?: Extract<Goal, { kind: "freedom" }> }) {
  const i18n = useI18n();
  const { m } = i18n;
  const t = m.goals.form;
  const [amount, setAmount] = useState<number | null>(initial?.amount ?? null);
  const [country, setCountry] = useState<string | null>(initial?.country ?? null);
  const [estimateDate, setEstimateDate] = useState<string | undefined>(initial?.estimateDate);
  const countries = useMemo(() => byCountryName(costOfLiving.countries, i18n), [i18n]);
  const source = countries.find((entry) => entry.code === country);
  return (
    <form className="space-y-2" onSubmit={(event) => {
      event.preventDefault();
      if (validAmount(amount)) onAdd({ kind: "freedom", amount, country,
        ...(country && estimateDate ? { estimateDate } : {}),
        ...(initial ? {} : { important: true }) });
    }}>
      <label className="block space-y-1 text-sm font-medium">
        <span>{t.expenses}</span>
        <LiveNumberInput value={amount} onValue={(value) => { setAmount(value); setCountry(null); setEstimateDate(undefined); }} placeholder={t.amountMonthPlaceholder} />
      </label>
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer py-2 font-medium text-accent">{t.countryEstimate}</summary>
        <select aria-label={t.chooseCountry} className={inputClass} value={country ?? ""} onChange={(event) => {
          const selected = countries.find((entry) => entry.code === event.target.value);
          if (selected) {
            setCountry(selected.code);
            setAmount(selected.monthlyCostEur.withRent);
            setEstimateDate(selected.priceLevel ? String(selected.priceLevel.year) : selected.referenceDate);
          }
        }}>
          <option value="" disabled>{t.chooseCountry}</option>
          {countries.map((entry) => <option key={entry.code} value={entry.code}>{countryName(entry.code, i18n)}</option>)}
        </select>
      </details>
      <p className="text-sm font-medium text-muted">{source
        ? t.onePerson(countryName(source.code, i18n), estimateDate ?? "")
        : t.ownExpenses}</p>
      {source && <p className="text-sm font-medium text-muted">{t.includesRent}</p>}
      <Button type="submit" variant="primary" disabled={!validAmount(amount)}>{initial ? m.goals.edit : t.add}</Button>
    </form>
  );
}

/** A thing of the list at the prices of `country`, or one of the user's own at their price. */
function BuyForm({ onAdd, country }: { onAdd: (goal: NewGoal) => void; country: string }) {
  const i18n = useI18n();
  const { m } = i18n;
  const t = m.goals.form;
  const items = useMemo(() => [...pricedItems(country)].sort((a, b) => a.amount - b.amount || a.id.localeCompare(b.id)), [country]);
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
              {t.thingOption(itemName(item.id, i18n), itemPrice(item, i18n))}
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
  const [label, setLabel] = useState("");
  const valid = validAmount(amount);
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onAdd({ kind: "amount", amount, ...(label.trim() ? { label: label.trim().slice(0, 60) } : {}), important: true });
      }}
    >
      <label className="block space-y-1 text-sm font-medium">
        <span>{t.goalName}</span>
        <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={60} placeholder={t.goalPlaceholder} className={inputClass} />
      </label>
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
export function GoalsSection({ calc, today, wishCountry, inCard = false }: { calc: Calculation; today: Date; wishCountry: string; inCard?: boolean }) {
  const { m } = useI18n();
  const [adding, setAdding] = useState(false);
  const { goals } = calc;
  const ordered = [...goals].sort((a, b) => Number(Boolean(b.goal.important)) - Number(Boolean(a.goal.important)));
  const hasPriorities = goals.some((status) => status.goal.important);
  return (
    // Under a section titled "My goals" (inCard) it needs no name of its own: two places with one name confuse a screen reader.
    <section aria-labelledby={goals.length > 0 && !inCard ? "goals-title" : undefined} aria-label={goals.length > 0 || inCard ? undefined : m.goals.title} className="space-y-2">
      {inCard && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-medium text-muted">{goals.length ? m.help.goals : m.goals.empty}</p>
          <PricesOf country={wishCountry} />
        </div>
      )}
      {goals.length > 0 && (
        <>
          {!inCard && (
            <h2 id="goals-title" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
              {m.goals.title}
              <Help what={m.goals.title} text={m.help.goals} />
            </h2>
          )}
          {hasPriorities && <h3 className="text-base font-semibold">{m.goals.priorities}</h3>}
          <ul className="divide-y divide-border rounded-xl border border-border bg-card px-2">
            {ordered.map((status, index) => (
              <Fragment key={status.goal.id}>
                {hasPriorities && !status.goal.important && ordered[index - 1]?.goal.important && <li role="presentation" className="pt-3"><h3 className="text-base font-semibold">{m.goals.otherGoals}</h3></li>}
                <GoalRow status={status} calc={calc} today={today} />
              </Fragment>
            ))}
          </ul>
        </>
      )}
      {adding ? (
        <AddGoal onDone={() => setAdding(false)} wishCountry={wishCountry} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 py-1 text-base font-medium text-accent hover:bg-accent/10"
        >
          <Plus aria-hidden="true" className="size-4" /> {m.goals.add}
        </button>
      )}
    </section>
  );
}
