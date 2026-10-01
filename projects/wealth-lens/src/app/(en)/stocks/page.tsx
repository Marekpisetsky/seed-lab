import { StocksPage } from "@/components/pages/stocks-page";
import { pageMetadata } from "@/i18n/metadata";

export const metadata = pageMetadata("en", "stocks");

export default function Page() {
  return <StocksPage locale="en" />;
}
