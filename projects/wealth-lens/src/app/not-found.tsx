import type { Metadata } from "next";
import { getI18n } from "@/i18n";
import { localePath, PREFIXED_LOCALES } from "@/i18n/locales";
import { pageHref } from "@/lib/site";

const EN = getI18n("en");

export const metadata: Metadata = { title: EN.m.notFound.title, robots: { index: false } };

/**
 * Any address that is not a page. The language is unknown, so it speaks
 * every language the site has, each with its way home. Plain HTML, with no
 * code of its own: it sits under every page, and must not bring a
 * language's words, or a second copy of Link, to all of them. Plain <a>
 * links, so they carry Wealth Lens's folder themselves (pageHref).
 */
export default function NotFound() {
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
          <a href={pageHref("/")} className="flex min-h-11 items-center text-lg font-extrabold tracking-tight">
            {EN.m.site.name}
          </a>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        <div className="max-w-xl space-y-8 py-8">
          {(["en", ...PREFIXED_LOCALES] as const).map((locale) => {
            const { m } = getI18n(locale);
            return (
              <section key={locale} lang={locale} className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">{m.notFound.title}</h1>
                <p className="text-muted">{m.notFound.text}</p>
                <a href={pageHref(localePath("/", locale))} className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-medium text-accent-foreground">
                  {m.notFound.home}
                </a>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
