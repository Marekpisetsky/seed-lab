import { MoneyPage } from "@/components/pages/money-page";
import { pageMetadata } from "@/i18n/metadata";

export const metadata = pageMetadata("en", "money");

export default function Page() {
  return <MoneyPage locale="en" />;
}
