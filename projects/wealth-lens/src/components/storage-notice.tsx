"use client";

import { useSyncExternalStore } from "react";
import { getBrowserStorage, isStorageWritable } from "@/lib/storage";

const noopSubscribe = () => () => {};

// Probing writes to storage, so do it once per page load, not on every render.
let writable: boolean | null = null;
const getWritable = () => (writable ??= isStorageWritable(getBrowserStorage()));

/** Warns once, at the top of every page, when nothing can be saved. */
export function StorageNotice() {
  const canSave = useSyncExternalStore(noopSubscribe, getWritable, () => true);
  if (canSave) return null;
  return (
    <div role="status" className="border-b border-warning-border bg-warning-bg text-warning-foreground">
      <p className="mx-auto max-w-5xl px-4 py-2 text-sm">
        Your browser blocks storage: what you enter is lost when you close this tab.
      </p>
    </div>
  );
}
