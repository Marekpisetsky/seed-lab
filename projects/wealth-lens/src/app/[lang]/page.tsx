import { MoneyPage } from "@/components/pages/money-page";
import { asLocale } from "@/i18n/route";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]">) {
  return pageMetadata(asLocale((await params).lang), "money");
}

export default async function Page({ params }: PageProps<"/[lang]">) {
  return <MoneyPage locale={asLocale((await params).lang)} />;
}
