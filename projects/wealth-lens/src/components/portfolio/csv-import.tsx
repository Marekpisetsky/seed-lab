"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { formatNumber } from "@/lib/format";
import {
  IMPORT_FORMAT_LABELS,
  importHoldingsCsv,
  type ImportedPosition,
  type ImportOutcome,
} from "@/lib/import";

interface CsvImportProps {
  hasHoldings: boolean;
  onImport: (positions: ImportedPosition[]) => void;
}

type Preview = { fileName: string; outcome: ImportOutcome };

/** File picker + preview. Nothing is replaced until the user confirms. */
export function CsvImport({ hasHoldings, onImport }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const handleFile = async (file: File) => {
    try {
      setPreview({ fileName: file.name, outcome: importHoldingsCsv(await file.text()) });
    } catch {
      setPreview({ fileName: file.name, outcome: { ok: false, error: "The file could not be read." } });
    }
  };

  const reset = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          id="holdings-csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button onClick={() => inputRef.current?.click()}>Import CSV…</Button>
        <p className="text-xs text-muted">
          Trading 212: History → Export CSV. Or a CSV with columns ticker, quantity, cost_basis, currency.
        </p>
      </div>

      {preview && (
        <ImportPreview
          preview={preview}
          hasHoldings={hasHoldings}
          onCancel={reset}
          onConfirm={(positions) => {
            onImport(positions);
            reset();
          }}
        />
      )}
    </div>
  );
}

interface ImportPreviewProps {
  preview: Preview;
  hasHoldings: boolean;
  onConfirm: (positions: ImportedPosition[]) => void;
  onCancel: () => void;
}

function ImportPreview({ preview: { fileName, outcome }, hasHoldings, onConfirm, onCancel }: ImportPreviewProps) {
  if (!outcome.ok) {
    return (
      <Notice tone="warning" title={`Could not import ${fileName}`}>
        <p>{outcome.error}</p>
        <Button size="sm" variant="ghost" className="mt-2" onClick={onCancel}>
          Dismiss
        </Button>
      </Notice>
    );
  }

  const { positions, issues, ignored, rowCount, format } = outcome;
  const ignoredTotal = ignored.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4 text-sm" aria-live="polite">
      <p>
        <span className="font-medium">{fileName}</span> · {IMPORT_FORMAT_LABELS[format]} · {rowCount} rows read.
      </p>

      {positions.length > 0 ? (
        <div>
          <p className="font-medium">
            {positions.length} open position{positions.length === 1 ? "" : "s"} found:
          </p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {positions.map((position) => (
              <li key={`${position.ticker}-${position.currency}`} className="rounded bg-border/50 px-2 py-0.5 tabular-nums">
                {position.ticker} · {formatNumber(position.quantity)} · {position.currency}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="font-medium">No open positions found in this file.</p>
      )}

      {ignoredTotal > 0 && (
        <p className="text-muted">
          Ignored {ignoredTotal} row{ignoredTotal === 1 ? "" : "s"} that are not trades:{" "}
          {ignored.map((row) => `${row.label} (${row.count})`).join(", ")}.
        </p>
      )}

      {issues.length > 0 && (
        <Notice tone="warning" title={`${issues.length} row${issues.length === 1 ? "" : "s"} could not be read`}>
          <ul className="max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5">
            {issues.map((issue) => (
              <li key={`${issue.line}-${issue.message}`}>
                Line {issue.line}: {issue.message}
              </li>
            ))}
          </ul>
        </Notice>
      )}

      <div className="flex flex-wrap gap-2">
        {positions.length > 0 && (
          <Button variant="primary" onClick={() => onConfirm(positions)}>
            {hasHoldings ? `Replace my holdings with these ${positions.length}` : `Import ${positions.length}`}
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {hasHoldings && positions.length > 0 && (
        <p className="text-xs text-muted">
          Importing replaces your current list. Current prices you already entered are kept for the same ticker.
        </p>
      )}
    </div>
  );
}
