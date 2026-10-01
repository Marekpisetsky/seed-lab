"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { SettledNumberInput } from "@/components/ui/form";
import { RadioGroup } from "@/components/ui/radio-group";
import { useAppState } from "@/hooks/use-app";
import { selectorName } from "@/i18n/investment-text";
import { setAssumptions } from "@/lib/app-store";
import { growthText, quotedGrowth, realismWarning } from "@/lib/assumptions";
import { CHIP_IDS, chipOf, chipRate, pickChip, type ChipId } from "@/lib/chips";
import type { ResolvedInvestment } from "@/lib/investment";

/** Percent with at most two decimals, as the field shows it. */
const asPercent = (fraction: number) => Number((fraction * 100).toFixed(2));

/** "My %": the one number, growth a year after rising prices, typed. */
function MyGrowth({ value, focus }: { value: number; focus: boolean }) {
  const { m } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  // Tapping "My %" opens the field to type in; arriving with it chosen (a loaded file) does not move the focus.
  useEffect(() => {
    if (focus) input.current?.focus();
  }, [focus]);
  return (
    <span className="relative block max-w-48">
      <SettledNumberInput
        ref={input}
        aria-label={m.growth.mine}
        value={asPercent(value)}
        min={-50}
        max={50}
        placeholder={m.growth.mineExample}
        onCommit={(percent) => setAssumptions({ growth: percent / 100 })}
        className="pr-7 text-base placeholder:italic placeholder:text-muted"
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
        %
      </span>
    </span>
  );
}

/**
 * "How much does it grow a year?": chips to pick with one tap (S&P 500,
 * World, 60/40, bonds, savings) or "My %" to type a number. The one number
 * shown is the growth after rising prices; its equivalent before them is
 * read-only, small, below it. No list to open, no switch.
 */
export function GrowthChips({ current, label }: { current: ResolvedInvestment; label: string }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.growth;
  const { plan } = useAppState();
  const picked = chipOf(plan.investment);
  // Set by a tap on "My %" (not by arriving with it chosen): its field then takes the focus.
  const [tapped, setTapped] = useState(false);
  const options = CHIP_IDS.map((id) => ({
    value: id,
    label: id === "sp500" || id === "world" ? t.chips[id](f.rate(chipRate(id))) : t.chips[id],
  }));
  const pick = (id: ChipId) => {
    setTapped(id === "mine");
    pickChip(id, current.realReturn);
  };
  const grows = growthText(current, i18n);
  // No chip is it (Nasdaq-100, another mix, My portfolio), or its ups and downs or prices were changed: say which.
  const changed = picked !== "mine" && (current.custom || current.customInflation);
  const line = picked === null || changed ? t.named(selectorName(current, i18n), grows) : grows;
  const warning = realismWarning(current, i18n);

  return (
    <div className="space-y-2">
      <RadioGroup
        label={label}
        options={options}
        value={picked}
        onChange={pick}
        className="flex flex-wrap gap-2"
        optionClassName={(checked) =>
          `min-h-11 rounded-full border px-3.5 py-1.5 text-sm font-medium tabular-nums ${
            checked ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-border/40"
          }`
        }
      />
      {picked === "mine" && <MyGrowth value={current.realReturn} focus={tapped} />}
      <div>
        <p className="text-base font-semibold tabular-nums">
          <Changed value={line} />
        </p>
        <p className="text-xs text-muted tabular-nums">
          <Changed value={t.before(f.rate(quotedGrowth(current)))} />
        </p>
      </div>
      {warning && (
        <p role="status" className="rounded-md border border-warning-border bg-warning-bg px-2 py-1 text-sm text-warning-foreground">
          {warning}
        </p>
      )}
    </div>
  );
}
