import { InfoPage } from "@/components/pages/info-page";
import { pageMetadata } from "@/i18n/metadata";

export const metadata = pageMetadata("en", "terms");

export default function Page() {
  return <InfoPage locale="en" page="terms" />;
}
