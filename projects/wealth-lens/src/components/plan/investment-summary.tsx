"use client";

import { useState } from "react";
import { formatRate } from "@/lib/format";
import { INDEXES } from "@/lib/indexes";
import type { ResolvedInvestment } from "@/lib/investment";
import { InvestmentPicker, mixLabel } from "./investment-picker";

/** One sentence: what the plan grows like and at which rate, with a way to change it. */
export function InvestmentSummary({ investment }: { investment: ResolvedInvestment }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-sm">
        <GrowthSentence investment={investment} />{" "}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          {open ? "Done" : "Change"}
        </button>
      </p>
      {open && <InvestmentPicker onChosen={() => setOpen(false)} />}
    </div>
  );
}

function GrowthSentence({ investment }: { investment: ResolvedInvestment }) {
  const { investment: choice, name, realReturn, period, mix, proxyIndex } = investment;
  const rate = <strong className="tabular-nums">{formatRate(realReturn)} a year after inflation</strong>;
  const average = `(${period[0]}–${period[1]} average)`;
  if (choice.kind === "custom") {
    return <>Grows {rate} (your own rate).</>;
  }
  if (choice.kind === "portfolio" && mix) {
    return (
      <>
        Grows like <strong>your portfolio</strong> ({mixLabel(mix)}): {rate} {average}.
      </>
    );
  }
  if (proxyIndex) {
    return (
      <>
        Grows like <strong>{name}</strong>, projected with the {INDEXES[proxyIndex].name}: {rate} {average}.
      </>
    );
  }
  return (
    <>
      Grows like the <strong>{name}</strong>: {rate} {average}.
    </>
  );
}
