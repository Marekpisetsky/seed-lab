import { HowItWorksPage } from "@/components/pages/how-it-works-page";
import { pageMetadata } from "@/i18n/metadata";

export const metadata = pageMetadata("en", "howItWorks");

export default function Page() {
  return <HowItWorksPage locale="en" />;
}
