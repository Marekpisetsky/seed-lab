import { StocksPage } from "@/components/pages/stocks-page";
import { asLocale } from "@/i18n/route";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/stocks">) {
  return pageMetadata(asLocale((await params).lang), "stocks");
}

export default async function Page({ params }: PageProps<"/[lang]/stocks">) {
  return <StocksPage locale={asLocale((await params).lang)} />;
}
