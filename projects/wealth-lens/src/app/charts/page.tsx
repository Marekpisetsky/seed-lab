import type { Metadata } from "next";
import { ChartsModule } from "@/components/charts/charts-module";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Charts" };

export default function ChartsPage() {
  return (
    <>
      <PageHeader title="Charts" question="How is each stock doing?" />
      <ChartsModule />
    </>
  );
}
