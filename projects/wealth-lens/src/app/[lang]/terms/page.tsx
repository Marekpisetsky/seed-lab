import { InfoPage } from "@/components/pages/info-page";
import { asLocale } from "@/i18n/route";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">) {
  return pageMetadata(asLocale((await params).lang), "terms");
}

export default async function Page({ params }: PageProps<"/[lang]/terms">) {
  return <InfoPage locale={asLocale((await params).lang)} page="terms" />;
}
