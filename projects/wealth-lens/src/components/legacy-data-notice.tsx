"use client";

import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { replaceState } from "@/lib/app-store";
import { browserStorage, deleteLegacyData, hasLegacyData, readLegacyData } from "@/lib/legacy-storage";

const noopSubscribe = () => () => {};
let found: boolean | null = null;
const getFound = () => (found ??= hasLegacyData(browserStorage()));

/**
 * Shown once when an earlier version left data in this browser's storage:
 * load it into this visit, or just delete it. Either way it is removed.
 */
export function LegacyDataNotice() {
  const { m } = useI18n();
  const present = useSyncExternalStore(noopSubscribe, getFound, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (!present || dismissed) return null;

  const finish = (load: boolean) => {
    const storage = browserStorage();
    const state = load ? readLegacyData(storage) : null;
    if (state) replaceState(state);
    deleteLegacyData(storage);
    found = false;
    setDismissed(true);
  };

  return (
    <div role="status" className="border-b border-warning-border bg-warning-bg text-warning-foreground">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 text-sm">
        <p className="flex-1">{m.data.legacy}</p>
        <Button size="sm" variant="primary" onClick={() => finish(true)}>
          {m.data.useIt}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => finish(false)}>
          {m.data.deleteIt}
        </Button>
      </div>
    </div>
  );
}
