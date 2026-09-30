import { PREFIXED_LOCALES } from "@/i18n/locales";

/** Every language but English gets its own copy of the site under /<lang>/ (es: /es, /es/stocks…). */
export function generateStaticParams() {
  return PREFIXED_LOCALES.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export default function LanguageLayout({ children }: LayoutProps<"/[lang]">) {
  return children;
}
