"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n";
import { PricesUpdated } from "@/components/prices-updated";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gain } from "@/components/ui/gain";
import { RowMenu } from "@/components/ui/row-menu";
import { marketPrice } from "@/lib/auto-price";
import { holdingGain, holdingValue } from "@/lib/finance";
import { holdingToFormValues, withPriceSource } from "@/lib/holding-form";
import { createId } from "@/lib/id";
import { mergeImportedHoldings } from "@/lib/import/merge";
import type { Updater } from "@/lib/app-store";
import type { Holding } from "@/lib/types";
import type { I18n } from "@/i18n";
import { CsvImport } from "./csv-import";
import { HoldingForm } from "./holding-form";

type Editor = { mode: "closed" } | { mode: "add" } | { mode: "edit"; id: string };

interface HoldingsListProps {
  holdings: readonly Holding[];
  onChange: (next: Updater<readonly Holding[]>) => unknown;
}

/** Compact list: ticker, value, gain. Everything else sits behind the row menu. */
export function HoldingsList({ holdings, onChange }: HoldingsListProps) {
  const { m, f } = useI18n();
  const t = m.holdings;
  const [editor, setEditor] = useState<Editor>({ mode: "closed" });
  const editing = editor.mode === "edit" ? holdings.find((holding) => holding.id === editor.id) : undefined;

  const update = (id: string, patch: Partial<Holding>) =>
    onChange((previous) => previous.map((holding) => (holding.id === id ? { ...holding, ...patch } : holding)));

  return (
    <Card title={t.title}>
      <div className="space-y-4">
        {editor.mode === "add" && (
          <HoldingForm
            submitLabel={t.add}
            onCancel={() => setEditor({ mode: "closed" })}
            onSubmit={(value) => {
              onChange((previous) => [...previous, { ...withPriceSource(value, null), id: createId() }]);
              setEditor({ mode: "closed" });
            }}
          />
        )}
        {editing && (
          <HoldingForm
            key={editing.id}
            initialValues={holdingToFormValues(editing, (value) => f.number(value, 8))}
            submitLabel={t.save(editing.ticker)}
            onCancel={() => setEditor({ mode: "closed" })}
            onSubmit={(value) => {
              update(editing.id, withPriceSource(value, editing));
              setEditor({ mode: "closed" });
            }}
          />
        )}

        {holdings.length === 0 ? (
          <p className="text-sm text-muted">{t.empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {holdings.map((holding) => (
              <HoldingRow
                key={holding.id}
                holding={holding}
                onEdit={() => setEditor({ mode: "edit", id: holding.id })}
                onUseMarketPrice={() => update(holding.id, { priceSource: "auto", currentPrice: null, priceDate: null })}
                onRemove={() => {
                  if (window.confirm(t.confirmRemove(holding.ticker))) {
                    onChange((previous) => previous.filter((item) => item.id !== holding.id));
                  }
                }}
              />
            ))}
          </ul>
        )}
        {holdings.length > 0 && <PricesUpdated />}

        {editor.mode === "closed" && (
          <div className="flex flex-wrap items-start gap-2">
            <Button variant="primary" onClick={() => setEditor({ mode: "add" })}>
              {t.add}
            </Button>
            <CsvImport
              hasHoldings={holdings.length > 0}
              onImport={(positions) => onChange((previous) => mergeImportedHoldings(previous, positions, createId))}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

interface HoldingRowProps {
  holding: Holding;
  onEdit: () => void;
  onUseMarketPrice: () => void;
  onRemove: () => void;
}

function HoldingRow({ holding, onEdit, onUseMarketPrice, onRemove }: HoldingRowProps) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.holdings;
  const value = holdingValue(holding);
  const gain = holdingGain(holding);
  return (
    <li className="flex items-center gap-2 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{holding.ticker}</p>
        <p className="truncate text-xs text-muted">{priceNote(holding, i18n)}</p>
      </div>
      <div className="text-right">
        {value === null || gain === null ? (
          <button type="button" onClick={onEdit} className="min-h-11 px-2 text-sm font-medium text-accent">
            {t.addPrice}
          </button>
        ) : (
          <>
            <p className="font-semibold tabular-nums">{f.money(value, holding.currency, { decimals: 0 })}</p>
            <Gain gain={gain} currency={holding.currency} decimals={0} className="text-xs" />
          </>
        )}
      </div>
      <RowMenu
        label={t.actions(holding.ticker)}
        items={[
          { label: t.edit, onSelect: onEdit },
          ...(holding.priceSource === "manual" && marketPrice(holding) ? [{ label: t.useDaily, onSelect: onUseMarketPrice }] : []),
          { label: t.remove, onSelect: onRemove, tone: "danger" as const },
        ]}
      />
    </li>
  );
}

function priceNote(holding: Holding, { m, f }: I18n): string {
  const t = m.holdings;
  if (holding.currentPrice === null) return t.noPrice;
  if (holding.priceSource === "manual") return t.yourPrice;
  return holding.priceDate ? t.priceFrom(f.dayMonth(holding.priceDate)) : t.dailyPrice;
}
