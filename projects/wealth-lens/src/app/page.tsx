import { PageHeader } from "@/components/page-header";
import { PortfolioModule } from "@/components/portfolio/portfolio-module";

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        title="Portfolio & goal"
        question="How much have I really gained, and how long until I reach my goal?"
      />
      <PortfolioModule />
    </>
  );
}
