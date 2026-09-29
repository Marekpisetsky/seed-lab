"use client";

import { useReport, warmUp as warmReport } from "@/hooks/use-report";
import { appStore } from "@/lib/app-store";
import { startOfUtcDay } from "@/lib/dates";
import { OtherThingsSection } from "./connections-section";
import { DetailSection } from "./detail-section";
import { FindingsSection } from "./findings-section";
import { LeversSection } from "./levers-section";
import { MissionBar, MissionUnavailable } from "./mission-bar";
import { PurchaseNote } from "./purchase-note";
import { ReportHeadline } from "./report-headline";

/** Runs the first simulations while the mission is being chosen, so the first answer appears at once. */
export function warmUp(): void {
  warmReport(appStore.get(), startOfUtcDay(new Date()));
}

/** The mission, and the answer to it. */
export function ReportTop() {
  const bundle = useReport();
  if (!bundle) return <MissionUnavailable />;
  const { report } = bundle;
  return (
    <div className="space-y-5">
      <MissionBar goal={report.goal} />
      <ReportHeadline report={report} />
      {report.purchase && (
        <PurchaseNote purchase={report.purchase} monthly={report.scenario.monthly} name={report.goal.status.connection.name} />
      )}
    </div>
  );
}

/** Everything under the numbers, for the mission; the rest folded away. */
export function ReportBody() {
  const bundle = useReport();
  if (!bundle) return null;
  const { report, findings, levers } = bundle;
  return (
    <div className="space-y-10">
      <FindingsSection findings={findings} />
      <LeversSection levers={levers} />
      <div className="space-y-3">
        <DetailSection report={report} />
        <OtherThingsSection report={report} />
      </div>
    </div>
  );
}
