"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { ImportedPosition, ImportOutcome } from "@/lib/import/types";
import { problem, problemText } from "@/lib/problems";

interface CsvImportProps {
  hasHoldings: boolean;
  onImport: (positions: ImportedPosition[]) => void;
}

type Preview = { fileName: string; outcome: ImportOutcome };

/** File picker + preview. Nothing is replaced until the user confirms. */
export function CsvImport({ hasHoldings, onImport }: CsvImportProps) {
  const { m } = useI18n();
  const t = m.holdings.import;
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const handleFile = async (file: File) => {
    try {
      // The parsers load only when a file is picked, keeping them off the first screen.
      const [{ importHoldingsCsv }, text] = await Promise.all([import("@/lib/import"), file.text()]);
      setPreview({ fileName: file.name, outcome: importHoldingsCsv(text) });
    } catch {
      setPreview({ fileName: file.name, outcome: { ok: false, error: problem("file-unreadable", { file: file.name }) } });
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
          // Opened by the visible button next to it: one stop for Tab, not two.
          tabIndex={-1}
          aria-label={t.choose}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button onClick={() => inputRef.current?.click()}>{t.button}</Button>
        <p className="text-xs text-muted">{t.hint}</p>
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
  const { m, f } = useI18n();
  const t = m.holdings.import;
  if (!outcome.ok) {
    return (
      <Notice tone="warning" title={t.couldNotImport(fileName)}>
        <p>{problemText(outcome.error, m.problems)}</p>
        <Button size="sm" variant="ghost" className="mt-2" onClick={onCancel}>
          {t.dismiss}
        </Button>
      </Notice>
    );
  }

  const { positions, issues, ignored, rowCount, format } = outcome;
  const ignoredTotal = ignored.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4 text-sm" aria-live="polite">
      <p>
        <span className="font-medium">{fileName}</span> · {t.formats[format]} · {t.rowsRead(rowCount)}
      </p>

      {positions.length > 0 ? (
        <div>
          <p className="font-medium">{t.found(positions.length)}</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {positions.map((position) => (
              <li key={`${position.ticker}-${position.currency}`} className="rounded bg-border/50 px-2 py-0.5 tabular-nums">
                {position.ticker} · {f.number(position.quantity)} · {position.currency}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="font-medium">{t.none}</p>
      )}

      {ignoredTotal > 0 && <p className="text-muted">{t.ignored(ignoredTotal, ignored.map((row) => `${row.label ?? t.noAction} (${row.count})`).join(", "))}</p>}

      {issues.length > 0 && (
        <Notice tone="warning" title={t.unreadable(issues.length)}>
          <ul className="max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5">
            {issues.map((issue) => {
              const text = problemText(issue.problem, m.problems);
              return <li key={`${issue.line}-${text}`}>{t.line(issue.line, text)}</li>;
            })}
          </ul>
        </Notice>
      )}

      <div className="flex flex-wrap gap-2">
        {positions.length > 0 && (
          <Button variant="primary" onClick={() => onConfirm(positions)}>
            {hasHoldings ? t.replace(positions.length) : t.importCount(positions.length)}
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
      {hasHoldings && positions.length > 0 && <p className="text-xs text-muted">{t.replaceNote}</p>}
    </div>
  );
}
