"use client";

import { CalendarRange, ShieldCheck, UserX } from "lucide-react";
import dynamic from "next/dynamic";
import { useI18n } from "@/components/i18n";
import { useCalculation } from "@/hooks/use-calculation";
import { COMMON_PERIOD } from "@/lib/indexes";
import { CalculatorCard } from "./calculator-card";

/** The result, its chart and its cards: their code loads once there is a result to show. */
const Results = dynamic(() => import("./results").then((module) => module.Results));

/**
 * "My money": the questions first, on their own. Until both amounts are
 * typed there is one calm line, with three things to trust (no accounts,
 * nothing saved, the years of the data), and nothing else; then the
 * result in levels (lib/plan.ts, planReady).
 */
export function MoneyModule() {
  const { m } = useI18n();
  const bundle = useCalculation();
  return (
    <div className="space-y-6">
      <CalculatorCard />
      {bundle.ready ? (
        <Results bundle={bundle} />
      ) : (
        <div className="space-y-3 px-1">
          <p role="status" className="text-base text-muted">
            {m.calculator.calm}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {[
              { Icon: UserX, text: m.money.trust.noAccount },
              { Icon: ShieldCheck, text: m.money.trust.nothingSaved },
              { Icon: CalendarRange, text: m.money.trust.data(`${COMMON_PERIOD[0]}–${COMMON_PERIOD[1]}`) },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5">
                <Icon aria-hidden="true" className="size-4 shrink-0 text-accent" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
