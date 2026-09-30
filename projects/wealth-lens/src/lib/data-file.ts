/**
 * "Download my data" and "Load my data": the whole app state as one JSON
 * file the user keeps. It is created and read in the browser; nothing is
 * uploaded anywhere.
 */

import { INITIAL_STATE, type AppState } from "./app-store";
import { toIsoDate } from "./dates";
import { problem, type Problem } from "./problems";
import { isRecord, parseHoldings, parsePlan, parseUploadedPrices, type Notices, type UploadedPrices } from "./validation";

export const DATA_FILE_KIND = "wealth-lens-data";
export const DATA_FILE_VERSION = 6;

export function dataFileName(savedAt: Date): string {
  return `wealth-lens-${toIsoDate(savedAt)}.json`;
}

export function serializeState(state: AppState, savedAt: Date): string {
  const file = {
    kind: DATA_FILE_KIND,
    version: DATA_FILE_VERSION,
    savedAt: savedAt.toISOString(),
    plan: state.plan,
    holdings: state.holdings,
    uploadedPrices: state.uploadedPrices,
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** A loaded file, with one-line notices for what it had that the app no longer does (a single stock projected on its own). */
export type DataFileResult = { ok: true; state: AppState; notices: Notices } | { ok: false; error: Problem };

/**
 * Reads a file made by "Download my data" (versions 1 to 6); anything invalid
 * inside falls back field by field.
 */
export function parseDataFile(text: string): DataFileResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: problem("data-not-json") };
  }
  if (!isRecord(json) || json.kind !== DATA_FILE_KIND) {
    return { ok: false, error: problem("data-not-ours") };
  }
  if (typeof json.version !== "number" || json.version > DATA_FILE_VERSION) {
    return { ok: false, error: problem("data-newer") };
  }
  const uploadedPrices: Record<string, UploadedPrices> = {};
  if (isRecord(json.uploadedPrices)) {
    for (const [ticker, value] of Object.entries(json.uploadedPrices)) {
      const prices = parseUploadedPrices(value);
      if (prices) uploadedPrices[ticker] = prices;
    }
  }
  const holdings = parseHoldings(json.holdings) ?? [];
  const notices: Notices = [];
  return {
    ok: true,
    state: {
      plan: parsePlan(json.plan, holdings, notices) ?? INITIAL_STATE.plan,
      holdings,
      uploadedPrices,
      // A "What if…?" is a look at the plan, not part of it: a loaded file starts without one.
      whatIf: null,
    },
    notices,
  };
}
