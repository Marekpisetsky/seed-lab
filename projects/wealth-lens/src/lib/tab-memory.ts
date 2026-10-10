/**
 * What you type stays in this tab while it is open, so it is never lost
 * on the way between pages: a page loaded afresh (a new version of the
 * site, a tap before the page's code arrived, a reload, a phone that put
 * the tab to sleep) finds it again. It lives in the tab's session storage,
 * like the light or dark choice: never sent, not shared with other tabs,
 * gone when the tab closes. A "What if…?" is a look, not kept.
 *
 * The plan is kept as "Download my data" writes it (data-file.ts), so an
 * older version's is read the same careful way.
 */

import { appStore, INITIAL_STATE, replaceState } from "./app-store";
import { parseDataFile, serializeState } from "./data-file";

export const TAB_KEY = "horalis-growth:plan";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** The tab's plan back, if the page loaded afresh with nothing typed yet. True when one was found. */
export function restoreFromTab(): boolean {
  const tab = storage();
  if (!tab || appStore.get() !== INITIAL_STATE) return false;
  let text: string | null = null;
  try {
    text = tab.getItem(TAB_KEY);
  } catch {
    return false;
  }
  if (!text) return false;
  const read = parseDataFile(text);
  if (!read.ok) return false;
  replaceState(read.state);
  return true;
}

/** From now on, every change of the plan is kept in the tab; returns the way to stop. */
export function keepInTab(): () => void {
  const tab = storage();
  if (!tab) return () => {};
  let last = appStore.get().plan;
  return appStore.subscribe(() => {
    const { plan } = appStore.get();
    if (plan === last) return;
    last = plan;
    try {
      tab.setItem(TAB_KEY, serializeState({ plan, whatIf: null }, new Date()));
    } catch {
      // Storage full or blocked: the page goes on, as before.
    }
  });
}
