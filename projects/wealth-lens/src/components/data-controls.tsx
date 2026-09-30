"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app";
import { replaceState } from "@/lib/app-store";
import { dataFileName, parseDataFile, serializeState } from "@/lib/data-file";

/** Download and Load, always: the calculator works from the first second. */
export function FooterDataControls() {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <DownloadDataButton />
      <LoadDataButton />
    </div>
  );
}

/** Saves the whole state as a JSON file, made in the browser. */
export function DownloadDataButton() {
  const state = useAppState();
  return (
    <Button
      size="sm"
      onClick={() => {
        const now = new Date();
        const url = URL.createObjectURL(new Blob([serializeState(state, now)], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = dataFileName(now);
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }}
    >
      Download my data
    </Button>
  );
}

/** Reads a file made by "Download my data". It is read here, never uploaded. */
export function LoadDataButton({ variant = "secondary" }: { variant?: "secondary" | "ghost" }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<string[]>([]);

  const load = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError(`Could not read ${file.name}.`);
      return;
    }
    const result = parseDataFile(text);
    if (!result.ok) {
      setError(result.error);
      setNotices([]);
      return;
    }
    setError(null);
    setNotices(result.notices);
    replaceState(result.state);
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-label="Load a Wealth Lens data file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void load(file);
          event.target.value = "";
        }}
      />
      <Button size="sm" variant={variant} onClick={() => inputRef.current?.click()}>
        Load my data
      </Button>
      {error && (
        <span role="alert" className="text-xs text-negative">
          {error}
        </span>
      )}
      {notices.map((notice) => (
        <span key={notice} role="status" className="max-w-md text-xs text-muted">
          {notice}
        </span>
      ))}
    </span>
  );
}
