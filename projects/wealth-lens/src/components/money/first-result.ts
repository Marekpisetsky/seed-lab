"use client";

import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/app-store";

/**
 * Whether the first result was asked for with "See my result", kept while
 * the page is open (never saved): from then on the button is gone and the
 * result follows every change, whatever field changes or empties.
 */
export const firstResult = createStore(false);

/** Read the same way on the server: it is false there (a page is built before anyone asks), and the tests can set it. */
export function useFirstResultAsked(): boolean {
  return useSyncExternalStore(firstResult.subscribe, firstResult.get, firstResult.get);
}
