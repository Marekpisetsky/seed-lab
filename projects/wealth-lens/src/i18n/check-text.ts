/**
 * "Check your plan" in words, in the page's language: for each
 * observation, what stands out (`lead`, one or two short sentences) and the
 * figures behind it (`details`), every percent with its euros. The numbers
 * come from lib/plan-check.ts. Facts and consequences only: nothing to buy,
 * sell or weigh (research/legal/informar-no-aconsejar.md).
 */

import type { I18n } from ".";
import { goalName } from "./goal-text";
import { periodText } from "@/lib/investment";
import type { PlanCheck } from "@/lib/plan-check";

export interface CheckWords {
  lead: string[];
  details: string[];
}

export function checkWords(check: PlanCheck, i18n: I18n): CheckWords {
  const { m, f } = i18n;
  switch (check.id) {
    case "horizon": {
      const t = m.check.horizon;
      const years = m.units.years(check.years);
      const count = m.check.count(Math.round((check.below / check.futures) * 100));
      const first = check.goal ? t.goal(goalName(check.goal, i18n), years, f.cur(check.putIn)) : t.plan(f.cur(check.putIn), years);
      return { lead: [first, t.below(count)], details: [t.bad(f.cur(Math.max(0, check.putIn - check.bad))), t.why] };
    }
    case "savings": {
      const t = m.check.savings;
      // Whole euros, as shown, so each gap is the difference of the figures on the page.
      const [total, putIn, typical] = [check.total, check.putIn, check.stocks.typical].map(Math.round);
      const { stocks } = check;
      const lead = [t.keeps(m.units.years(check.years), f.cur(total)), total < putIn ? t.less(f.cur(putIn - total)) : t.more(f.cur(total - putIn))];
      // Both sides, one short sentence each: what savings give up, then US stocks' worst fall on the money they typically reach.
      const { fall } = stocks;
      const drop = fall ? Math.round(fall.drop * 100) / 100 : null;
      const sides =
        fall && drop !== null && typical > total
          ? [
              t.savingsLess(f.cur(typical - total)),
              t.stocksFall(fall.from === fall.to ? t.fallIn(fall.from) : t.fallBetween(fall.from, fall.to), f.percent(drop, { decimals: 0 }), f.cur(-typical * drop, { signed: true })),
            ]
          : [];
      const details = [...(total < putIn ? [t.why] : []), t.stocks(periodText(stocks), f.cur(typical)), ...sides, t.stocksBad(f.cur(stocks.bad))];
      return { lead, details };
    }
  }
}
