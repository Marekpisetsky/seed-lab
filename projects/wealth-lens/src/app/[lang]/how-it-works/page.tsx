import { HowItWorksPage } from "@/components/pages/how-it-works-page";
import { asLocale } from "@/i18n/route";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/how-it-works">) {
  return pageMetadata(asLocale((await params).lang), "howItWorks");
}

export default async function Page({ params }: PageProps<"/[lang]/how-it-works">) {
  return <HowItWorksPage locale={asLocale((await params).lang)} />;
}
