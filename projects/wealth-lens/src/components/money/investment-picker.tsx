"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { GOLD_NOTE, SAVINGS_RATE, type AssetId } from "@/lib/assets";
import { formatRate } from "@/lib/format";
import { INDEXES, INDEX_IDS, SERIES } from "@/lib/indexes";
import { INDEX_TRACKERS } from "@/lib/market-data";

/** What the picker can choose. */
export type PickChoice = { kind: "asset"; asset: AssetId } | { kind: "portfolio" } | { kind: "mix" } | { kind: "custom" };

type Group = "Indexes" | "Bonds" | "Gold" | "Savings" | "Your own figures" | "My portfolio" | "A mix";

interface Option {
  key: string;
  group: Group;
  choice: PickChoice;
  label: string;
  detail: string;
  /** Lower-case text the search looks in: name, tickers of funds that hold it, a few words. */
  haystack: string;
}

const tickers = (asset: keyof typeof INDEX_TRACKERS) => INDEX_TRACKERS[asset].join(" ");

/** Every asset a plan or a mix can be projected with. */
function assetOptions(): Option[] {
  const indexes: Option[] = INDEX_IDS.map((index) => {
    const info = INDEXES[index];
    return {
      key: `asset:${index}`,
      group: "Indexes",
      choice: { kind: "asset", asset: index },
      label: info.name,
      detail: `${formatRate(info.averageReturn)} a year after rising prices · e.g. ${info.etf}`,
      haystack: `${info.name} ${info.returnType} stocks index ${tickers(index)}`.toLowerCase(),
    };
  });
  return [
    ...indexes,
    {
      key: "asset:bonds",
      group: "Bonds",
      choice: { kind: "asset", asset: "bonds" },
      label: SERIES.bonds.name,
      detail: `${formatRate(SERIES.bonds.averageReturn)} a year after rising prices · 10-year German Bund · e.g. ${SERIES.bonds.etf}`,
      haystack: `euro government bonds bund germany ${tickers("bonds")}`.toLowerCase(),
    },
    {
      key: "asset:gold",
      group: "Gold",
      choice: { kind: "asset", asset: "gold" },
      label: SERIES.gold.name,
      detail: `${GOLD_NOTE}: protection, not growth · ${formatRate(SERIES.gold.averageReturn)} a year after rising prices`,
      haystack: `gold ${tickers("gold")}`.toLowerCase(),
    },
    {
      key: "asset:savings",
      group: "Savings",
      choice: { kind: "asset", asset: "savings" },
      label: "Savings account",
      detail: `${formatRate(SAVINGS_RATE)} interest minus rising prices, no ups and downs · your bank's rate can be typed in`,
      haystack: "savings account bank deposit cash interest",
    },
  ];
}

/**
 * The list behind "Invested in": only what has a long history and a known
 * range (indexes, euro government bonds, gold), a savings account, Custom
 * growth (the user's own figures), the portfolio when there are holdings,
 * and "A mix…";
 * grouped, with a search by name or fund ticker. Single stocks are not on
 * it: they are never projected on their own. Opens under `top` (px from
 * the calculator's top).
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
  /** For a mix's parts: the assets only. */
  onlyAssets?: boolean;
  label: string;
  onPick: (choice: PickChoice) => void;
  /** `true` when closed from the keyboard (Escape): the opener takes the focus back. */
  onClose: (fromKeyboard?: boolean) => void;
}) {
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
    const all = assetOptions();
    if (!onlyAssets) {
      all.push({
        key: "custom",
        group: "Your own figures",
        choice: { kind: "custom" },
        label: "Custom growth",
        detail: "Type your own growth and ups and downs, without choosing an asset",
        haystack: "custom growth own rate figures",
      });
      if (hasPortfolio) {
        all.push({
          key: "portfolio",
          group: "My portfolio",
          choice: { kind: "portfolio" },
          label: "My portfolio",
          detail: `${holdingsCount} holding${holdingsCount === 1 ? "" : "s"} by value, each growing like its index`,
          haystack: "my portfolio holdings",
        });
      }
      all.push({
        key: "mix",
        group: "A mix",
        choice: { kind: "mix" },
        label: "A mix…",
        detail: "Several of these with weights you set; quick 100% stocks, 80/20, 60/40",
        haystack: "a mix weights several combine 60/40 80/20 stocks bonds",
      });
    }
    return all.filter((option) => !exclude.includes(option.key));
  }, [hasPortfolio, holdingsCount, onlyAssets, exclude]);

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
          placeholder="Search by name or fund ticker"
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
        {shown.length === 0 && <li className="px-3 py-4 text-sm text-muted">Nothing on the list matches “{query}”. Single stocks are not projected on their own.</li>}
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
