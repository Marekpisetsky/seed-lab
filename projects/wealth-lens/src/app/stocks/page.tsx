import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StocksModule } from "@/components/stocks/stocks-module";

export const metadata: Metadata = { title: "My stocks" };

export default function StocksPage() {
  return (
    <>
      <PageHeader title="My stocks" question="What do I hold, and how did it move?" />
      <StocksModule />
    </>
  );
}
