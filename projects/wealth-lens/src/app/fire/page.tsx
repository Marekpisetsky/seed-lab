import type { Metadata } from "next";
import { FireModule } from "@/components/fire/fire-module";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "FIRE by country" };

export default function FirePage() {
  return (
    <>
      <PageHeader
        title="FIRE by country"
        question="How much do I need to live off my investments, and where?"
      />
      <FireModule />
    </>
  );
}
