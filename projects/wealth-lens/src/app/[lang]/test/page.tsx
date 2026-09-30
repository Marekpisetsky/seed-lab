import { TestPage } from "@/components/pages/test-page";
import { asLocale } from "@/i18n/route";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/test">) {
  return pageMetadata(asLocale((await params).lang), "test");
}

export default async function Page({ params }: PageProps<"/[lang]/test">) {
  return <TestPage locale={asLocale((await params).lang)} />;
}
