/**
 * "Download my data" and "Load my data": the whole app state as one JSON
 * file the user keeps. It is created and read in the browser; nothing is
 * uploaded anywhere.
 */

import { INITIAL_STATE, type AppState } from "./app-store";
import { toIsoDate } from "./dates";
import { isRecord, parseHoldings, parsePlan, parseUploadedPrices, type UploadedPrices } from "./validation";

export const DATA_FILE_KIND = "wealth-lens-data";
export const DATA_FILE_VERSION = 5;

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

export type DataFileResult = { ok: true; state: AppState } | { ok: false; error: string };

/**
 * Reads a file made by "Download my data" (versions 1 to 5); anything invalid
 * inside falls back field by field.
 */
export function parseDataFile(text: string): DataFileResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not a Wealth Lens data file (it is not valid JSON)." };
  }
  if (!isRecord(json) || json.kind !== DATA_FILE_KIND) {
    return { ok: false, error: "This file is not a Wealth Lens data file." };
  }
  if (typeof json.version !== "number" || json.version > DATA_FILE_VERSION) {
    return { ok: false, error: "This file was made by a newer version of Wealth Lens." };
  }
  const uploadedPrices: Record<string, UploadedPrices> = {};
  if (isRecord(json.uploadedPrices)) {
    for (const [ticker, value] of Object.entries(json.uploadedPrices)) {
      const prices = parseUploadedPrices(value);
      if (prices) uploadedPrices[ticker] = prices;
    }
  }
  return {
    ok: true,
    state: {
      plan: parsePlan(json.plan) ?? INITIAL_STATE.plan,
      holdings: parseHoldings(json.holdings) ?? [],
      uploadedPrices,
    },
  };
}
