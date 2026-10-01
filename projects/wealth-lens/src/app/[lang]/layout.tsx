import { notFound } from "next/navigation";
import { SpanishWords } from "@/components/i18n-es";
import { PREFIXED_LOCALES, type Locale } from "@/i18n/locales";
import { asLocale } from "@/i18n/route";

/** Every language but English gets its own copy of the site under /<lang>/ (es: /es, /es/stocks…). */
export function generateStaticParams() {
  return PREFIXED_LOCALES.map((lang) => ({ lang }));
}

export const dynamicParams = false;

/** Each language's words, apart from English's: a page's code holds only its own. */
const WORDS: Partial<Record<Locale, React.ComponentType<{ children: React.ReactNode }>>> = { es: SpanishWords };

export default async function LanguageLayout({ children, params }: LayoutProps<"/[lang]">) {
  const Words = WORDS[asLocale((await params).lang)];
  if (!Words) notFound();
  return <Words>{children}</Words>;
}
