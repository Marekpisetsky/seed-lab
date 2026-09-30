"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatPercent, formatRate } from "@/lib/format";
import { INDEXES, INDEX_IDS, type IndexId } from "@/lib/indexes";
import { INSTRUMENTS, MARKET } from "@/lib/market-data";
import { offeredRates } from "@/hooks/use-calculation";
import { resolveInvestment } from "@/lib/investment";
import { prepareMixDraws } from "@/lib/mix";
import { mixFigures, successRatesFor } from "@/lib/projections";
import { stockVolatility } from "@/lib/volatility";

/** What the picker can choose. */
export type PickChoice = { kind: "index"; index: IndexId } | { kind: "stock"; id: string } | { kind: "portfolio" } | { kind: "mix" };

interface Option {
  key: string;
  group: "Indexes" | "Stocks" | "My portfolio" | "A mix";
  choice: PickChoice;
  label: string;
  detail: string;
  /** Lower-case text the search looks in: name and tickers. */
  haystack: string;
}

const STOCKS = INSTRUMENTS.filter((instrument) => instrument.kind === "stock").sort((a, b) => a.name.localeCompare(b.name));

function baseOptions(): Option[] {
  const indexes: Option[] = INDEX_IDS.map((index) => {
    const info = INDEXES[index];
    return {
      key: `index:${index}`,
      group: "Indexes",
      choice: { kind: "index", index },
      label: info.name,
      detail: `${formatRate(info.averageReturn)} a year after inflation · e.g. ${info.etf}`,
      haystack: `${info.name} ${info.etf} ${info.returnType}`.toLowerCase(),
    };
  });
  const stocks: Option[] = STOCKS.map((instrument) => {
    const own = stockVolatility(instrument, MARKET);
    const index = INDEXES[instrument.index].name;
    return {
      key: `stock:${instrument.id}`,
      group: "Stocks",
      choice: { kind: "stock", id: instrument.id },
      label: instrument.name,
      detail: `${instrument.id} · grows like the ${index}, swings ${formatPercent(own.volatility, { decimals: 0 })} a year`,
      haystack: `${instrument.name} ${instrument.id} ${instrument.symbol}`.toLowerCase(),
    };
  });
  return [...indexes, ...stocks];
}

let warmed = false;

/**
 * While the user is still choosing, in idle moments one step at a time:
 * each stock's withdrawal success rates (5,000 simulations each) and the
 * mixes' random draws and first run. Choosing then recalculates at once.
 */
function warmChoices(rates: readonly number[]): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  const steps: (() => void)[] = [
    () => prepareMixDraws(3),
    () => {
      for (const rebalance of [false, true]) {
        const warm = resolveInvestment({ kind: "mix", parts: [{ ref: "index:world", weight: 50 }, { ref: "stock:NVDA", weight: 50 }], rebalance }, []);
        successRatesFor(warm, rates);
        mixFigures(warm, { start: 1000, monthly: 100, years: 20 });
      }
    },
    ...STOCKS.map((instrument) => () => {
      successRatesFor(resolveInvestment({ kind: "stock", id: instrument.id }, []), rates);
    }),
  ];
  const next = () => {
    const step = steps.shift();
    if (!step) return;
    step();
    schedule();
  };
  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(next);
    else window.setTimeout(next, 30);
  };
  schedule();
}

/**
 * The list behind "Invested in": every index and stock on the list, the
 * portfolio when there are holdings, and "A mix…", grouped, with a search
 * by name or ticker. Opens under `top` (px from the calculator's top).
 */
export function InvestmentPicker({
  top,
  selected,
  hasPortfolio,
  holdingsCount,
  exclude = [],
  withMix = true,
  label,
  withdrawalRate,
  onPick,
  onClose,
}: {
  top: number;
  /** The plan's; the rates the result offers are worked out ahead for every stock. */
  withdrawalRate: number;
  selected: string | null;
  hasPortfolio: boolean;
  holdingsCount: number;
  /** Options not offered (the parts a mix already has). */
  exclude?: readonly string[];
  withMix?: boolean;
  label: string;
  onPick: (choice: PickChoice) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const outside = (event: PointerEvent) => {
      if (panel.current && !panel.current.contains(event.target as Node)) onClose();
    };
    // Registered on the next frame, so the click that opened the list does not close it.
    const frame = requestAnimationFrame(() => document.addEventListener("pointerdown", outside));
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", outside);
    };
  }, [onClose]);

  useEffect(() => warmChoices(offeredRates(withdrawalRate)), [withdrawalRate]);

  const options = useMemo(() => {
    const all = baseOptions();
    if (hasPortfolio) {
      all.push({
        key: "portfolio",
        group: "My portfolio",
        choice: { kind: "portfolio" },
        label: "My portfolio",
        detail: `${holdingsCount} holding${holdingsCount === 1 ? "" : "s"}, weighted by value`,
        haystack: "my portfolio holdings",
      });
    }
    if (withMix) {
      all.push({
        key: "mix",
        group: "A mix",
        choice: { kind: "mix" },
        label: "A mix…",
        detail: "Several indexes and stocks, with weights you set",
        haystack: "a mix weights several combine",
      });
    }
    return all.filter((option) => !exclude.includes(option.key));
  }, [hasPortfolio, holdingsCount, withMix, exclude]);

  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return words.length === 0 ? options : options.filter((option) => words.every((word) => option.haystack.includes(word)));
  }, [options, query]);
  const current = Math.min(active, Math.max(0, shown.length - 1));

  const choose = (option: Option | undefined) => {
    if (option) onPick(option.choice);
  };

  return (
    <div
      ref={panel}
      className="absolute inset-x-2 z-30 rounded-xl border border-border bg-card shadow-lg sm:inset-x-4"
      style={{ top }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="relative border-b border-border p-2">
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          ref={input}
          role="combobox"
          aria-label={label}
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={shown[current] ? `${listId}-${shown[current].key}` : undefined}
          aria-autocomplete="list"
          value={query}
          placeholder="Search by name or ticker"
          autoComplete="off"
          className="w-full rounded-md bg-background py-2 pl-8 pr-3 text-base outline-none focus:ring-2 focus:ring-accent/30"
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive(Math.min(shown.length - 1, current + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive(Math.max(0, current - 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              choose(shown[current]);
            }
          }}
        />
      </div>
      <ul id={listId} role="listbox" aria-label={label} className="max-h-[min(60vh,26rem)] overflow-y-auto p-1">
        {shown.length === 0 && <li className="px-3 py-4 text-sm text-muted">Nothing on the list matches “{query}”.</li>}
        {shown.map((option, index) => (
          <li key={option.key} role="presentation">
            {(index === 0 || shown[index - 1].group !== option.group) && (
              <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">{option.group}</p>
            )}
            <div
              id={`${listId}-${option.key}`}
              role="option"
              aria-selected={option.key === selected}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(option)}
              className={`cursor-pointer rounded-md px-3 py-2 ${index === current ? "bg-accent/10" : ""} ${option.key === selected ? "font-semibold" : ""}`}
            >
              <span className="block text-sm">{option.label}</span>
              <span className="block text-xs text-muted">{option.detail}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
