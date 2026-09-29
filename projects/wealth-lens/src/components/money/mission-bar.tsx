"use client";

import { useState } from "react";
import { useAppState } from "@/hooks/use-app";
import { formatEur, formatEurRounded } from "@/lib/format";
import type { MissionGoal } from "@/lib/report";
import { MissionPicker } from "./mission-picker";

/** "€1,410 a month · €423,000 needed", "€24,326": what the mission costs, small. */
function costOf({ mission, status }: MissionGoal): string | null {
  if (mission.kind === "amount") return null;
  const { connection, target } = status;
  return connection.kind === "live"
    ? `${formatEur(connection.amount)} a month · ${formatEurRounded(target)} needed`
    : formatEur(connection.amount);
}

/**
 * The mission, always at the top, with a small control to change it. It
 * changes only from here: the app never picks another one.
 */
export function MissionBar({ goal }: { goal: MissionGoal }) {
  const [changing, setChanging] = useState(false);
  const cost = costOf(goal);
  return (
    <div className="space-y-4">
      <section aria-label="Your mission" className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Mission</p>
          <h2 className="text-xl font-semibold leading-snug tracking-tight">{goal.title}</h2>
          {cost && <p className="text-xs text-muted">{cost}</p>}
        </div>
        <button
          type="button"
          aria-expanded={changing}
          onClick={() => setChanging(!changing)}
          className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-accent/10"
        >
          {changing ? "Keep it" : "Change"}
        </button>
      </section>
      {changing && <MissionPicker onDone={() => setChanging(false)} />}
    </div>
  );
}

/** When the mission's own country or item is no longer in the data: choose again. */
export function MissionUnavailable() {
  const { plan } = useAppState();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {plan.mission ? "Your mission is no longer in the data. Choose it again:" : "Choose a mission to start."}
      </p>
      <MissionPicker />
    </div>
  );
}
