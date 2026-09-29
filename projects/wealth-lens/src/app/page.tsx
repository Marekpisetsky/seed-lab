import { PageHeader } from "@/components/page-header";
import { PortfolioModule } from "@/components/portfolio/portfolio-module";

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        title="Portfolio & goal"
        question="What have I gained, and when do I reach my goal?"
      />
      <PortfolioModule />
    </>
  );
}
