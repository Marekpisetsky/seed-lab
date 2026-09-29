"use client";

import { useReport } from "@/hooks/use-report";
import { ConnectionsSection } from "./connections-section";
import { DetailSection } from "./detail-section";
import { FindingsSection } from "./findings-section";
import { LeversSection } from "./levers-section";

export { ReportHeadline } from "./report-headline";

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
