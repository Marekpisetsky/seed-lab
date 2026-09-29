"use client";

import { Check, ChevronDown, House, ShoppingBag, Target, X } from "lucide-react";
import { useState } from "react";
import { updatePlan } from "@/lib/app-store";
import { formatEur, formatYears } from "@/lib/format";
import { withinReach, type ConnectionStatus, type Report } from "@/lib/report";
import { PlaceSettings } from "./place-settings";

/** Rows shown before "Show all". */
const VISIBLE = 6;

const byTime = (a: ConnectionStatus, b: ConnectionStatus) => a.months - b.months || a.target - b.target;

function StatusText({ months }: { months: number }) {
  if (months === 0) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-positive">
        <Check aria-hidden="true" className="size-4" />
        now
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap text-sm text-muted">
      {withinReach(months) ? `in ${formatYears(months)}` : "not at this pace"}
    </span>
  );
}

function Row({ status, missionId }: { status: ConnectionStatus; missionId: string }) {
  const { connection, months } = status;
  const isMission = connection.id === missionId;
  return (
    <li className={`flex items-center gap-3 rounded-lg px-2 py-2.5 ${isMission ? "bg-accent/10" : ""}`}>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {isMission && <Target aria-label="Your mission" className="size-3.5 shrink-0 text-accent" />}
          {connection.name}
        </span>
        <span className="block text-xs text-muted">
          {connection.kind === "live" ? `${formatEur(connection.amount)} a month` : formatEur(connection.amount)}
        </span>
      </span>
      <StatusText months={months} />
      {connection.group === "custom" && (
        <button
          type="button"
          aria-label={`Remove ${connection.name}`}
          onClick={() =>
            updatePlan((plan) => ({
              customConnections: plan.customConnections.filter((item) => `custom:${item.id}` !== connection.id),
            }))
          }
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-border/40"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </li>
  );
}

function Group({
  title,
  icon,
  statuses,
  missionId,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  statuses: ConnectionStatus[];
  missionId: string;
  className: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...statuses].sort(byTime);
  const first = sorted.slice(0, VISIBLE);
  const rest = sorted.slice(VISIBLE);
  return (
    <div className={`rounded-xl p-3 ${className}`}>
      <h3 className="mb-1 flex items-center gap-2 px-2 text-base font-semibold">
        {icon}
        {title}
      </h3>
      <ul>
        {(showAll ? sorted : first).map((status) => (
          <Row key={status.connection.id} status={status} missionId={missionId} />
        ))}
      </ul>
      {rest.length > 0 && (
        <button type="button" aria-expanded={showAll} onClick={() => setShowAll(!showAll)} className="px-2 py-2 text-sm font-medium text-accent">
          {showAll ? "Show fewer" : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}

/**
 * "Other things your money could do": every place to live off it and every
 * purchase, each "now" or "in N years". Folded away and only for reading:
 * the mission changes only from the top of the page.
 */
export function OtherThingsSection({ report }: { report: Report }) {
  const [open, setOpen] = useState(false);
  const { statuses, plan, goal } = report;
  const missionId = goal.status.connection.id;
  return (
    <details className="group rounded-xl border border-border bg-card" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Other things your money could do
        <ChevronDown aria-hidden="true" className="size-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      {open && (
        <div className="space-y-3 border-t border-border p-3">
          <PlaceSettings plan={plan} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Group
              title="Live off it"
              icon={<House aria-hidden="true" className="size-4 text-muted" />}
              statuses={statuses.filter((status) => status.connection.kind === "live")}
              missionId={missionId}
              className="border border-border bg-background"
            />
            <Group
              title="Buy it"
              icon={<ShoppingBag aria-hidden="true" className="size-4 text-muted" />}
              statuses={statuses.filter((status) => status.connection.kind === "buy")}
              missionId={missionId}
              className="border border-dashed border-border bg-background"
            />
          </div>
          <p className="px-1 text-xs text-muted">
            Estimates in today&apos;s euros. To make one of these your mission, use Change at the top.
          </p>
        </div>
      )}
    </details>
  );
}
