import { InfoPage } from "@/components/pages/info-page";
import { asLocale } from "@/i18n/route";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">) {
  return pageMetadata(asLocale((await params).lang), "privacy");
}

export default async function Page({ params }: PageProps<"/[lang]/privacy">) {
  return <InfoPage locale={asLocale((await params).lang)} page="privacy" />;
}
