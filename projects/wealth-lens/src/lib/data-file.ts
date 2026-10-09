/**
 * "Download my data" and "Load my data": the whole app state as one JSON
 * file the user keeps. It is created and read in the browser; nothing is
 * uploaded anywhere.
 */

import { INITIAL_STATE, type AppState } from "./app-store";
import { toIsoDate } from "./dates";
import { problem, type Problem } from "./problems";
import { isRecord, parsePlan, type Notices } from "./validation";

export const DATA_FILE_KIND = "wealth-lens-data";
/** 11: no holdings, no price files, no goals from a price list (9 October 2026). */
export const DATA_FILE_VERSION = 11;

export function dataFileName(savedAt: Date): string {
  return `horalis-growth-${toIsoDate(savedAt)}.json`;
}

export function serializeState(state: AppState, savedAt: Date): string {
  const file = {
    kind: DATA_FILE_KIND,
    version: DATA_FILE_VERSION,
    savedAt: savedAt.toISOString(),
    plan: state.plan,
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** A loaded file, with one-line notices for what it had that the app no longer does (stocks, a portfolio, a price list). */
export type DataFileResult = { ok: true; state: AppState; notices: Notices } | { ok: false; error: Problem };

/**
 * Reads a file made by "Download my data" (versions 1 to 11); anything invalid
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
  const notices: Notices = [];
  if (Array.isArray(json.holdings) && json.holdings.length > 0 && !(isRecord(json.plan) && isRecord(json.plan.investment) && json.plan.investment.kind === "portfolio")) {
    notices.push(problem("holdings-retired"));
  }
  return {
    ok: true,
    state: {
      plan: parsePlan(json.plan, notices, json.version) ?? INITIAL_STATE.plan,
      // A "What if…?" is a look at the plan, not part of it: a loaded file starts without one.
      whatIf: null,
    },
    notices,
  };
}
