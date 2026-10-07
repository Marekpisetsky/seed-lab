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
      // The euros come from the whole percent and euros shown, so a reader can check the sum: 48% of €14,411 = €6,917.
      const held = Math.round(check.amount);
      const amount = f.eur(held);
      const lead = check.where === "portfolio" ? t.portfolio(check.name, percent, amount) : (check.atEnd ? t.mixAtEnd : t.mix)(check.name, percent, amount);
      const fall = check.fall ? Math.round(check.fall.max * 100) / 100 : null;
      const change = check.change1y !== null ? Math.round(check.change1y * 100) / 100 : null;
      const details = [
        ...(check.fall && fall !== null ? [t.fall(check.fall.from.slice(0, 4), f.percent(-fall, { decimals: 0 }), f.eur(-held * fall, { signed: true }), amount)] : []),
        // A year ago it was worth what it is now ÷ (1 + change): from that to its euros now.
        ...(change !== null && change > -1 ? [t.lastYear(f.percent(change, { signed: true, decimals: 0 }), f.eur(held / (1 + change)), amount)] : []),
        ...(check.where === "mix" ? [t.growsLike(m.assets.inSentence[check.reference])] : []),
        t.oneCompany,
        ...(check.where === "portfolio" ? [t.euros] : []),
      ];
      return { lead: [lead], details };
    }
    case "savings": {
      const t = m.check.savings;
      // Whole euros, as shown, so each gap is the difference of the figures on the page.
      const [total, putIn, typical] = [check.total, check.putIn, check.world.typical].map(Math.round);
      const { world } = check;
      const lead = [t.keeps(m.units.years(check.years), f.eur(total)), total < putIn ? t.less(f.eur(putIn - total)) : t.more(f.eur(total - putIn))];
      // Both sides, one short sentence each: what savings give up, then world stocks' worst fall on the money they typically reach.
      const { fall } = world;
      const drop = fall ? Math.round(fall.drop * 100) / 100 : null;
      const sides =
        fall && drop !== null && typical > total
          ? [
              t.savingsLess(f.eur(typical - total)),
              t.stocksFall(fall.from === fall.to ? t.fallIn(fall.from) : t.fallBetween(fall.from, fall.to), f.percent(drop, { decimals: 0 }), f.eur(-typical * drop, { signed: true })),
            ]
          : [];
      const details = [...(total < putIn ? [t.why] : []), t.world(periodText(world), f.eur(typical)), ...sides, t.worldBad(f.eur(world.bad))];
      return { lead, details };
    }
  }
}
