/**
 * Small pure helpers: which capital the report starts from, and whether
 * there is a result to show.
 */

export interface StartingCapital {
  amount: number;
  /** The amount typed on "My money". */
  source: "answer";
}

/** The amount typed on "My money"; nothing typed yet counts as 0. */
export function startingCapital(invested: number | null): StartingCapital {
  return { amount: invested ?? 0, source: "answer" };
}

/**
 * Whether there is a result to show: both amounts are known, what the
 * user has and what they add each month. Until then My money only asks;
 * 0 is an answer, an empty field is not.
 */
export function planReady(plan: { invested: number | null; monthlyContribution: number | null }): boolean {
  return plan.invested !== null && plan.monthlyContribution !== null;
}
