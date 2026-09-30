import { InfoPage } from "@/components/pages/info-page";
import { asLocale } from "@/i18n/route";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">) {
  return pageMetadata(asLocale((await params).lang), "about");
}

export default async function Page({ params }: PageProps<"/[lang]/about">) {
  return <InfoPage locale={asLocale((await params).lang)} page="about" />;
}
