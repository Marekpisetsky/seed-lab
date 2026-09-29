"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/form";
import { Gain } from "@/components/ui/gain";
import { averageCost, holdingGain, holdingValue } from "@/lib/finance";
import { formatMoney, formatNumber } from "@/lib/format";
import { holdingToFormValues } from "@/lib/holding-form";
import { createId } from "@/lib/id";
import { mergeImportedHoldings } from "@/lib/import";
import type { Holding } from "@/lib/types";
import { CsvImport } from "./csv-import";
import { HoldingForm } from "./holding-form";

type Editor = { mode: "closed" } | { mode: "add" } | { mode: "edit"; id: string };

interface HoldingsCardProps {
  holdings: readonly Holding[];
  onChange: (update: (previous: readonly Holding[]) => readonly Holding[]) => void;
}

export function HoldingsCard({ holdings, onChange }: HoldingsCardProps) {
  const [editor, setEditor] = useState<Editor>({ mode: "closed" });
  const editing = editor.mode === "edit" ? holdings.find((holding) => holding.id === editor.id) : undefined;

  const updateHolding = (id: string, patch: Partial<Holding>) =>
    onChange((previous) => previous.map((holding) => (holding.id === id ? { ...holding, ...patch } : holding)));

  const removeHolding = (holding: Holding) => {
    if (window.confirm(`Remove ${holding.ticker} from your holdings?`)) {
      onChange((previous) => previous.filter((item) => item.id !== holding.id));
    }
  };

  return (
    <Card
      title="Holdings"
      description="Cost basis is the total you paid. Enter the current price per share to see your real gain."
      actions={
        editor.mode === "closed" && (
          <Button variant="primary" onClick={() => setEditor({ mode: "add" })}>
            Add holding
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {editor.mode === "add" && (
          <HoldingForm
            submitLabel="Add holding"
            onCancel={() => setEditor({ mode: "closed" })}
            onSubmit={(value) => {
              onChange((previous) => [...previous, { ...value, id: createId() }]);
              setEditor({ mode: "closed" });
            }}
          />
        )}
        {editing && (
          <HoldingForm
            key={editing.id}
            initialValues={holdingToFormValues(editing)}
            submitLabel={`Save ${editing.ticker}`}
            onCancel={() => setEditor({ mode: "closed" })}
            onSubmit={(value) => {
              updateHolding(editing.id, value);
              setEditor({ mode: "closed" });
            }}
          />
        )}

        {holdings.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            No holdings yet. Add one by hand or import a CSV export from your broker.
          </p>
        ) : (
          <HoldingsTable
            holdings={holdings}
            onPriceChange={(id, currentPrice) => updateHolding(id, { currentPrice })}
            onEdit={(id) => setEditor({ mode: "edit", id })}
            onRemove={removeHolding}
          />
        )}

        <CsvImport
          hasHoldings={holdings.length > 0}
          onImport={(positions) => onChange((previous) => mergeImportedHoldings(previous, positions, createId))}
        />
      </div>
    </Card>
  );
}

interface HoldingsTableProps {
  holdings: readonly Holding[];
  onPriceChange: (id: string, price: number | null) => void;
  onEdit: (id: string) => void;
  onRemove: (holding: Holding) => void;
}

function HoldingsTable({ holdings, onPriceChange, onEdit, onRemove }: HoldingsTableProps) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[20rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="py-2 pr-2 pl-4 font-medium sm:px-2">
              Holding
            </th>
            <th scope="col" className="hidden px-2 py-2 text-right font-medium md:table-cell">
              Cost basis
            </th>
            <th scope="col" className="px-2 py-2 font-medium">
              Current price
            </th>
            <th scope="col" className="hidden px-2 py-2 text-right font-medium md:table-cell">
              Value
            </th>
            <th scope="col" className="py-2 pr-4 pl-2 text-right font-medium sm:px-2">
              Gain / loss
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const average = averageCost(holding);
            const value = holdingValue(holding);
            const gain = holdingGain(holding);
            return (
              <tr key={holding.id} className="border-b border-border align-top last:border-0">
                <td className="py-3 pr-2 pl-4 sm:px-2">
                  <p className="font-semibold">{holding.ticker}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {formatNumber(holding.quantity)} × avg {average === null ? "—" : formatMoney(average, holding.currency)}
                  </p>
                  <div className="mt-1 flex gap-1">
                    <Button size="sm" variant="ghost" className="-ml-2" onClick={() => onEdit(holding.id)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onRemove(holding)}>
                      Remove
                    </Button>
                  </div>
                </td>
                <td className="hidden px-2 py-3 text-right tabular-nums md:table-cell">
                  {formatMoney(holding.costBasis, holding.currency)}
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    <NumberInput
                      key={String(holding.currentPrice)}
                      value={holding.currentPrice}
                      onCommit={(price) => onPriceChange(holding.id, price)}
                      min={0}
                      allowEmpty
                      placeholder="Price"
                      aria-label={`Current price of ${holding.ticker} in ${holding.currency}`}
                      className="w-20 sm:w-28"
                    />
                    <span className="hidden text-xs text-muted sm:inline">{holding.currency}</span>
                  </div>
                </td>
                <td className="hidden px-2 py-3 text-right tabular-nums md:table-cell">
                  {value === null ? "—" : formatMoney(value, holding.currency)}
                </td>
                <td className="py-3 pr-4 pl-2 text-right sm:px-2">
                  {gain === null || value === null ? (
                    <span className="text-xs text-muted">Needs a price</span>
                  ) : (
                    <>
                      <Gain gain={gain} currency={holding.currency} className="block" />
                      <span className="block text-xs whitespace-nowrap text-muted tabular-nums md:hidden">
                        Value {formatMoney(value, holding.currency)}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
