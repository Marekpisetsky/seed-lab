/**
 * For tests: the plan a first visit started with until step 3 started at
 * 5 % (the S&P 500 with its standard figures), with the example amounts. The
 * figures checked by hand (×2.3, +129 %, "€112,xxx") are this plan's.
 */

import { STANDARD_ASSUMPTIONS, type Plan } from "./types";
import { EXAMPLE_PLAN } from "./validation";

export const SP500_PLAN: Plan = { ...EXAMPLE_PLAN, investment: { kind: "asset", asset: "sp500" }, assumptions: STANDARD_ASSUMPTIONS };
