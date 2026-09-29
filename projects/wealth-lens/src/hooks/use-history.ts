"use client";

import { useEffect, useState } from "react";
import { decodeHistory, historyUrl } from "@/lib/market-data";
import type { PricePoint } from "@/lib/prices";

/**
 * One request per instrument for the whole visit, to the app's own static
 * files (public/data/history/), never to a price source. A failed load is
 * forgotten so that opening the chart again retries.
 */
const requests = new Map<string, Promise<PricePoint[] | null>>();

function loadHistory(id: string): Promise<PricePoint[] | null> {
  let pending = requests.get(id);
  if (!pending) {
    pending = fetch(historyUrl(id))
      .then((response) => (response.ok ? response.json() : null))
      .then(decodeHistory)
      .catch(() => null);
    requests.set(id, pending);
    void pending.then((points) => {
      if (!points) requests.delete(id);
    });
  }
  return pending;
}

export type HistoryState = { status: "idle" } | { status: "loading" } | { status: "ready"; points: PricePoint[] } | { status: "missing" };

/** The full daily series of a curated instrument; pass `null` to load nothing. */
export function useHistory(id: string | null): HistoryState {
  const [result, setResult] = useState<{ id: string; points: PricePoint[] | null } | null>(null);

  useEffect(() => {
    if (id === null) return;
    let cancelled = false;
    void loadHistory(id).then((points) => {
      if (!cancelled) setResult({ id, points });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (id === null) return { status: "idle" };
  if (result?.id !== id) return { status: "loading" };
  return result.points ? { status: "ready", points: result.points } : { status: "missing" };
}
