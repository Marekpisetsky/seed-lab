"use client";

import { useReport, warmUp as warmReport } from "@/hooks/use-report";
import { appStore } from "@/lib/app-store";
import { startOfUtcDay } from "@/lib/dates";
import { ConnectionsSection } from "./connections-section";
import { DetailSection } from "./detail-section";
import { FindingsSection } from "./findings-section";
import { LeversSection } from "./levers-section";

export { ReportHeadline } from "./report-headline";

/** Runs the first simulations while the user is still typing, so the first answer appears at once. */
export function warmUp(): void {
  warmReport(appStore.get(), startOfUtcDay(new Date()));
}

/** Everything under the answer, in the order it matters. */
export function ReportBody() {
  const { report, findings, levers } = useReport();
  return (
    <div className="space-y-10">
      <FindingsSection findings={findings} />
      <LeversSection levers={levers} />
      <ConnectionsSection report={report} />
      <DetailSection report={report} />
    </div>
  );
}
