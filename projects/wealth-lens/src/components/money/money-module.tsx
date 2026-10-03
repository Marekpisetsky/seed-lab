"use client";

import { CalendarRange, Pencil, ShieldCheck, UserX } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { useCalculation, type CalculationBundle } from "@/hooks/use-calculation";
import { COMMON_PERIOD } from "@/lib/indexes";
import { CalculatorCard, MoreOptionsLink } from "./calculator-card";
import { firstResult, TOTAL_ID, useFirstResultAsked } from "./first-result";
import { measure, play, type FlipSnapshot } from "./flip";

/** The result, its chart and its sections in sight: their code loads once both amounts are in, before the button is pressed. */
const loadResults = () => import("./results").then((module) => module.Results);
const Results = dynamic(loadResults);
const preloadResults = () => void loadResults();
/** "What if…?" beside the result on a wide screen: with the result's code, not the first screen's. */
const WhatIfPanel = dynamic(() => import("./what-if-row").then((module) => module.WhatIfPanel));

const stillWanted = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The first screen's one column: the whole width on a phone, the card's width from 1024 px (its columns are fixed there), centred. */
export const START_COLUMN = "mx-auto w-full max-w-xl lg:max-w-[49rem]";

function TrustPoints() {
  const { m } = useI18n();
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-base text-muted">
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
  );
}

/** On a phone, once there is a result: the plan in one line at the foot of the screen, where the thumb is, and "Edit". */
function PlanBar({ bundle, sheet, onEdit, button }: { bundle: CalculationBundle; sheet: string; onEdit: () => void; button: React.Ref<HTMLButtonElement> }) {
  const { m, f } = useI18n();
  const t = m.calculator;
  const { plan, holdings } = bundle.state;
  const amount = (value: number | null) => (value === null ? "–" : f.eur(value));
  const have = holdings.length > 0 ? f.eur(bundle.base.capital.amount) : amount(plan.invested);
  const summary = t.summary(have, amount(plan.monthlyContribution), f.rate(bundle.base.investment.realReturn), m.units.years(plan.years));
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgb(0_0_0/0.08)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:starting:translate-y-full lg:hidden">
      <div className="mx-auto flex max-w-(--sk-width) items-center gap-3">
        <p className="min-w-0 flex-1 text-base font-medium tabular-nums">{summary}</p>
        <button
          ref={button}
          type="button"
          aria-expanded={false}
          aria-controls={sheet}
          onClick={onEdit}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-foreground px-4 text-base font-semibold text-background hover:opacity-90"
        >
          <Pencil aria-hidden="true" className="size-4" />
          {t.edit}
        </button>
      </div>
    </div>
  );
}

/**
 * "My money". First, the four steps on their own, with three things to
 * trust under them. "See my result" brings the result in once both amounts
 * are in (lib/plan.ts, planReady); from then on the button is gone for
 * good, the result follows every change, and the page is laid out by its
 * width:
 *
 * - 1440 px and more: three columns. "What if…?" on the left and the steps
 *   on the right, narrow and in sight while the page scrolls; the result
 *   in the middle, the widest (at least 640 px).
 * - 1024 to 1439 px: the result on the left; on the right, in sight, the
 *   steps and under them "What if…?".
 * - A phone: one column. The plan in one line at the foot of the screen
 *   with "Edit", which opens the steps from below over at most half of
 *   the screen, the big number in sight above them, changing as they do.
 *   "What if…?" is a section under the chart.
 *
 * The card is the same element throughout, so nothing typed is lost. On
 * "See my result" it glides and shrinks into its place beside the result,
 * and the headline and the header follow theirs (FLIP, components/money/
 * flip.ts: transforms only, no layout shift); the result comes in by parts.
 * No motion for those who ask for less.
 */
export function MoneyModule({ header }: { header?: React.ReactNode }) {
  const { m } = useI18n();
  const bundle = useCalculation();
  const asked = useFirstResultAsked();
  const [arriving, setArriving] = useState(false);
  const [editing, setEditing] = useState(false);
  const arrived = useCallback(() => setArriving(false), []);
  const sheet = useId();
  const sheetTitle = useId();
  const holder = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (bundle.ready) preloadResults();
  }, [bundle.ready]);
  // "See my result": where everything is now, then the change; it glides from there once React has drawn it (flip.ts).
  const before = useRef<FlipSnapshot | null>(null);
  const see = () => {
    const card = holder.current?.querySelector("section[aria-label]") ?? null;
    before.current = measure([
      // seed-kit's header widens with a result on a wide screen: its parts glide too.
      ...[...document.querySelectorAll(".sk-header .sk-brand, .sk-header .sk-nav, .sk-header .sk-actions")].map((element) => ({ element })),
      { element: top.current },
      // The steps' column scrolls beside the result (and so clips): it lets the card glide in from outside it.
      { element: card, content: card?.querySelector("ol") ?? null, unclip: holder.current },
      { element: holder.current?.querySelector("[data-more-options]") ?? null, unclip: holder.current },
    ]);
    firstResult.set(true);
    setArriving(true);
  };
  useLayoutEffect(() => {
    if (!asked || !before.current) return;
    play(before.current);
    before.current = null;
  }, [asked]);
  // The sheet opens over the lower half; the page moves so the big number sits above it.
  const openSheet = () => {
    setEditing(true);
    requestAnimationFrame(() => {
      document.getElementById(sheetTitle)?.focus({ preventScroll: true });
      const total = document.getElementById(TOTAL_ID)?.getBoundingClientRect();
      // Under seed-lab's header, which stays in sight at the top.
      const below = Math.max(0, document.querySelector(".sk-header")?.getBoundingClientRect().bottom ?? 0);
      if (total && (total.top < below + 8 || total.bottom > window.innerHeight / 2)) window.scrollBy({ top: total.top - below - 16, behavior: stillWanted() ? "auto" : "smooth" });
    });
  };
  const closeSheet = () => {
    setEditing(false);
    requestAnimationFrame(() => editButton.current?.focus());
  };
  const shown = asked && bundle.ready;
  const sheetOpen = asked && editing;

  return (
    // At first, one column in the middle of the page, as wide as the card: the headline, the card, More options and what to trust, aligned.
    <div className={asked ? "space-y-6 sm:space-y-8" : `${START_COLUMN} space-y-6 sm:space-y-8`}>
      <div ref={top}>{header}</div>
      <div
        data-layout={asked ? "results" : "start"}
        className={asked ? "lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 wide:grid-cols-[15rem_minmax(40rem,1fr)_20rem]" : "space-y-6"}
      >
        {asked && (
          <aside className="hidden wide:sticky wide:top-[calc(var(--sk-header-space)+1rem)] wide:block wide:max-h-[calc(100dvh-var(--sk-header-space)-2rem)] wide:overflow-y-auto">{shown && <WhatIfPanel bundle={bundle} />}</aside>
        )}
        {asked && (
          <div className="min-w-0 space-y-6">
            {shown ? (
              <Results bundle={bundle} arrive={arriving} onArrived={arrived} />
            ) : (
              <>
                {/* After a first result, an amount taken away: the line says what is missing. */}
                <p role="status" className="text-base text-muted">
                  {m.calculator.calm}
                </p>
                <TrustPoints />
              </>
            )}
          </div>
        )}
        {/* The steps: on their own at first; then beside the result, or in the sheet on a phone. Always this one element. */}
        <div
          ref={holder}
          id={sheet}
          data-steps
          role={sheetOpen ? "dialog" : undefined}
          aria-modal={sheetOpen ? false : undefined}
          aria-labelledby={sheetOpen ? sheetTitle : undefined}
          onKeyDown={(event) => event.key === "Escape" && sheetOpen && closeSheet()}
          className={
            asked
              ? `space-y-3 lg:sticky lg:top-[calc(var(--sk-header-space)+1rem)] lg:block lg:max-h-[calc(100dvh-var(--sk-header-space)-2rem)] lg:overflow-y-auto ${
                  editing
                    ? "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:max-h-[50dvh] max-lg:overflow-y-auto max-lg:rounded-t-2xl max-lg:border-t max-lg:border-border max-lg:bg-background max-lg:p-4 max-lg:shadow-[0_-8px_24px_rgb(0_0_0/0.15)] motion-safe:max-lg:transition-transform motion-safe:max-lg:duration-300 motion-safe:max-lg:starting:translate-y-full"
                    : "max-lg:hidden"
                }`
              : "space-y-2"
          }
        >
          {sheetOpen && (
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <h2 id={sheetTitle} tabIndex={-1} className="text-lg font-bold outline-none">
                {m.calculator.editTitle}
              </h2>
              <button
                type="button"
                onClick={closeSheet}
                className="inline-flex min-h-11 items-center rounded-md bg-foreground px-4 text-base font-semibold text-background hover:opacity-90"
              >
                {m.calculator.done}
              </button>
            </div>
          )}
          <CalculatorCard onSee={asked ? undefined : see} compact={asked} />
          <MoreOptionsLink />
          {shown && (
            <div className="hidden lg:block wide:hidden">
              <WhatIfPanel bundle={bundle} />
            </div>
          )}
        </div>
        {!asked && <TrustPoints />}
        {asked && !editing && <PlanBar bundle={bundle} sheet={sheet} onEdit={openSheet} button={editButton} />}
      </div>
    </div>
  );
}
