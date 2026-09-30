import { TestPage } from "@/components/pages/test-page";
import { pageMetadata } from "@/i18n/metadata";

export const metadata = pageMetadata("en", "test");

export default function Page() {
  return <TestPage locale="en" />;
}
