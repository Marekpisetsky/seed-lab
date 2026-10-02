"use client";

import { CalendarRange, ShieldCheck, UserX } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n";
import { useCalculation } from "@/hooks/use-calculation";
import { COMMON_PERIOD } from "@/lib/indexes";
import { CalculatorCard, MoreOptionsLink } from "./calculator-card";
import { firstResult, useFirstResultAsked } from "./first-result";

/** The result, its chart and its sections: their code loads once both amounts are in, before the button is pressed. */
const loadResults = () => import("./results").then((module) => module.Results);
const Results = dynamic(loadResults);


/**
 * "My money": the four steps first, on their own, with three things to
 * trust under them (no accounts, nothing saved, the years of the data).
 * "See my result" brings the result in, gently, once both amounts are in
 * (lib/plan.ts, planReady); from then on the button is gone for good and
 * the result follows every change.
 */
export function MoneyModule() {
  const { m } = useI18n();
  const bundle = useCalculation();
  const asked = useFirstResultAsked();
  const [arriving, setArriving] = useState(false);
  const arrived = useCallback(() => setArriving(false), []);
  useEffect(() => {
    if (bundle.ready) void loadResults();
  }, [bundle.ready]);
  const see = () => {
    firstResult.set(true);
    setArriving(true);
  };
  const shown = asked && bundle.ready;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <CalculatorCard onSee={asked ? undefined : see} />
        <MoreOptionsLink />
      </div>
      {shown ? (
        <Results bundle={bundle} arrive={arriving} onArrived={arrived} />
      ) : (
        <div className="space-y-3 px-1">
          {/* After a first result, an amount taken away: the button is gone, so the line says what is missing. */}
          {asked && (
            <p role="status" className="text-base text-muted">
              {m.calculator.calm}
            </p>
          )}
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
