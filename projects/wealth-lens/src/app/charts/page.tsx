import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Charts" };

export default function ChartsPage() {
  return <PageHeader title="Charts" question="How is each of my stocks doing on its own?" />;
}
