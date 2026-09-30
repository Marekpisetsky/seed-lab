import type { Metadata } from "next";
import Link from "next/link";
import { Site } from "@/components/site/site";
import { getI18n } from "@/i18n";
import { localePath, PREFIXED_LOCALES } from "@/i18n/locales";

const EN = getI18n("en");

export const metadata: Metadata = { title: EN.m.notFound.title, robots: { index: false } };

/**
 * Any address that is not a page. The language is unknown, so it speaks
 * every language the site has, each with its way home.
 */
export default function NotFound() {
  return (
    <Site locale="en">
      <div className="max-w-xl space-y-8 py-8">
        {(["en", ...PREFIXED_LOCALES] as const).map((locale) => {
          const { m } = getI18n(locale);
          return (
            <section key={locale} lang={locale} className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">{m.notFound.title}</h1>
              <p className="text-muted">{m.notFound.text}</p>
              <Link href={localePath("/", locale)} className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-medium text-accent-foreground">
                {m.notFound.home}
              </Link>
            </section>
          );
        })}
      </div>
    </Site>
  );
}
