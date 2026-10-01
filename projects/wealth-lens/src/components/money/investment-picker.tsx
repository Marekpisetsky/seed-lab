"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import type { I18n } from "@/i18n";
import { stockPartDetail } from "@/i18n/investment-text";
import { ENGLISH_SEARCH_WORDS } from "@/i18n/messages/search-words";
import { SAVINGS_RATE, type AssetId } from "@/lib/assets";
import { INDEXES, INDEX_IDS, SERIES } from "@/lib/indexes";
import { INDEX_TRACKERS, INSTRUMENTS } from "@/lib/market-data";

/** What the picker can choose; a stock only as a part of a mix. */
export type PickChoice = { kind: "asset"; asset: AssetId } | { kind: "stock"; stock: string } | { kind: "portfolio" } | { kind: "mix" } | { kind: "custom" };

type Group = keyof I18n["m"]["picker"]["groups"];

interface Option {
  key: string;
  group: Group;
  choice: PickChoice;
  label: string;
  detail: string;
  /** Lower-case text the search looks in: names and words in the page's language and in English, and fund tickers. */
  haystack: string;
}

const tickers = (asset: keyof typeof INDEX_TRACKERS) => INDEX_TRACKERS[asset].join(" ");
/** Search words in the page's language and in English, so "gold" finds gold on the Spanish page too. */
const words = ({ m }: I18n, key: keyof I18n["m"]["picker"]["words"]) => `${m.picker.words[key]} ${ENGLISH_SEARCH_WORDS[key]}`;

/** Every asset a plan or a mix can be projected with. */
function assetOptions(i18n: I18n): Option[] {
  const { m, f } = i18n;
  const indexes: Option[] = INDEX_IDS.map((index) => {
    const info = INDEXES[index];
    return {
      key: `asset:${index}`,
      group: "indexes",
      choice: { kind: "asset", asset: index },
      label: m.assets.name[index],
      detail: m.picker.index(f.rate(info.averageReturn), info.etf),
      haystack: `${m.assets.name[index]} ${info.name} ${words(i18n, "index")} ${tickers(index)}`.toLowerCase(),
    };
  });
  return [
    ...indexes,
    {
      key: "asset:bonds",
      group: "bonds",
      choice: { kind: "asset", asset: "bonds" },
      label: m.assets.name.bonds,
      detail: m.picker.bonds(f.rate(SERIES.bonds.averageReturn), SERIES.bonds.etf),
      haystack: `${m.assets.name.bonds} ${words(i18n, "bonds")} ${tickers("bonds")}`.toLowerCase(),
    },
    {
      key: "asset:gold",
      group: "gold",
      choice: { kind: "asset", asset: "gold" },
      label: m.assets.name.gold,
      detail: m.picker.gold(f.rate(SERIES.gold.averageReturn)),
      haystack: `${m.assets.name.gold} ${words(i18n, "gold")} ${tickers("gold")}`.toLowerCase(),
    },
    {
      key: "asset:savings",
      group: "savings",
      choice: { kind: "asset", asset: "savings" },
      label: m.assets.name.savings,
      detail: m.picker.savings(f.rate(SAVINGS_RATE)),
      haystack: `${m.assets.name.savings} ${words(i18n, "savings")}`.toLowerCase(),
    },
  ];
}

/** The stocks of the list, for a mix: each grows like its index, with its own ups and downs. */
function stockOptions(i18n: I18n): Option[] {
  return INSTRUMENTS.filter((instrument) => instrument.kind === "stock").map((stock) => ({
    key: `stock:${stock.id}`,
    group: "stocks",
    choice: { kind: "stock", stock: stock.id },
    label: stock.name,
    detail: stockPartDetail(stock, i18n),
    haystack: `${stock.name} ${stock.id} ${stock.symbol} ${words(i18n, "stock")}`.toLowerCase(),
  }));
}

/**
 * The list behind "Invested in": only what has a long history and a known
 * range (indexes, euro government bonds, gold), a savings account, Custom
 * growth (the user's own figures), the portfolio when there are holdings,
 * and "A mix…";
 * grouped, with a search by name or fund ticker. Single stocks are not on
 * it: they are never projected on their own. For a mix's parts (`onlyAssets`)
 * the assets and the stocks of the list, each stock growing like its index.
 * Opens under `top` (px from the calculator's top).
 */
export function InvestmentPicker({
  top,
  selected,
  hasPortfolio,
  holdingsCount,
  exclude = [],
  onlyAssets = false,
  label,
  onPick,
  onClose,
}: {
  top: number;
  selected: string | null;
  hasPortfolio: boolean;
  holdingsCount: number;
  /** Options not offered (the parts a mix already has). */
  exclude?: readonly string[];
  /** For a mix's parts: the assets and the stocks of the list. */
  onlyAssets?: boolean;
  label: string;
  onPick: (choice: PickChoice) => void;
  /** `true` when closed from the keyboard (Escape): the opener takes the focus back. */
  onClose: (fromKeyboard?: boolean) => void;
}) {
  const i18n = useI18n();
  const { m } = i18n;
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const outside = (event: PointerEvent) => {
      if (panel.current && !panel.current.contains(event.target as Node)) onClose(false);
    };
    // Registered on the next frame, so the click that opened the list does not close it.
    const frame = requestAnimationFrame(() => document.addEventListener("pointerdown", outside));
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", outside);
    };
  }, [onClose]);

  const options = useMemo(() => {
    const all = assetOptions(i18n);
    if (onlyAssets) all.push(...stockOptions(i18n));
    else {
      all.push({
        key: "custom",
        group: "own",
        choice: { kind: "custom" },
        label: m.invest.custom,
        detail: m.picker.custom,
        haystack: `${m.invest.custom} ${words(i18n, "custom")}`.toLowerCase(),
      });
      if (hasPortfolio) {
        all.push({
          key: "portfolio",
          group: "portfolio",
          choice: { kind: "portfolio" },
          label: m.invest.portfolio,
          detail: m.picker.portfolio(holdingsCount),
          haystack: `${m.invest.portfolio} ${words(i18n, "portfolio")}`.toLowerCase(),
        });
      }
      all.push({
        key: "mix",
        group: "mix",
        choice: { kind: "mix" },
        label: m.picker.mixLabel,
        detail: m.picker.mix,
        haystack: `${m.picker.mixLabel} ${words(i18n, "mix")} 60/40 80/20`.toLowerCase(),
      });
    }
    return all.filter((option) => !exclude.includes(option.key));
  }, [i18n, m, hasPortfolio, holdingsCount, onlyAssets, exclude]);

  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return words.length === 0 ? options : options.filter((option) => words.every((word) => `${option.label.toLowerCase()} ${option.haystack}`.includes(word)));
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
          onClose(true);
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
          placeholder={m.picker.search}
          autoComplete="off"
          className="min-h-11 w-full rounded-md bg-background py-2 pl-8 pr-3 text-base outline-none focus:ring-2 focus:ring-accent/30"
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
      <ul id={listId} role="listbox" aria-label={label} className="max-h-[min(60vh,28rem)] overflow-y-auto p-1">
        {shown.length === 0 && <li className="px-3 py-4 text-sm text-muted">{m.picker.none(query)}</li>}
        {shown.map((option, index) => (
          <li key={option.key} role="presentation">
            {(index === 0 || shown[index - 1].group !== option.group) && (
              <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">{m.picker.groups[option.group]}</p>
            )}
            <div
              id={`${listId}-${option.key}`}
              role="option"
              aria-selected={option.key === selected}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(option)}
              className={`min-h-11 cursor-pointer rounded-md px-3 py-2 ${index === current ? "bg-accent/10" : ""} ${option.key === selected ? "font-semibold" : ""}`}
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
