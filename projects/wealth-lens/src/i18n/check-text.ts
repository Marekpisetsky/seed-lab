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
      const first = check.goal ? t.goal(goalName(check.goal, i18n), years, f.eur(check.putIn)) : t.plan(f.eur(check.putIn), years);
      return { lead: [first, t.below(count)], details: [t.bad(f.eur(Math.max(0, check.putIn - check.bad))), t.why] };
    }
    case "concentration": {
      const t = m.check.concentration;
      const percent = f.percent(check.share, { decimals: 0 });
      const amount = f.eur(check.amount);
      const lead = check.where === "portfolio" ? t.portfolio(check.name, percent, amount) : (check.atEnd ? t.mixAtEnd : t.mix)(check.name, percent, amount);
      const details = [
        ...(check.fall ? [t.fall(check.fall.from.slice(0, 4), f.percent(-check.fall.max, { decimals: 0 }), f.eur(-check.amount * check.fall.max, { signed: true }), amount)] : []),
        // A year ago it was worth amount ÷ (1 + change): the change, in euros of what is held.
        ...(check.change1y !== null ? [t.lastYear(f.percent(check.change1y, { signed: true, decimals: 0 }), f.eur(check.amount - check.amount / (1 + check.change1y), { signed: true }))] : []),
        ...(check.where === "mix" ? [t.growsLike(m.assets.inSentence[check.reference])] : []),
        t.oneCompany,
        ...(check.where === "portfolio" ? [t.euros] : []),
      ];
      return { lead: [lead], details };
    }
    case "savings": {
      const t = m.check.savings;
      const { total, putIn, world } = check;
      const lead = [t.keeps(m.units.years(check.years), f.eur(total)), total < putIn ? t.less(f.eur(putIn - total)) : t.more(f.eur(total - putIn))];
      const details = [
        ...(total < putIn ? [t.why] : []),
        t.world(periodText(world), f.eur(world.typical), f.eur(world.typical - total)),
        t.worldBad(f.eur(world.bad)),
      ];
      return { lead, details };
    }
  }
}
