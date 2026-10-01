"use client";

import { useEffect } from "react";
import { FooterDataControls } from "@/components/data-controls";
import { useI18n } from "@/components/i18n";
import { LegacyDataNotice } from "@/components/legacy-data-notice";
import { MainNav } from "@/components/main-nav";
import { IntentLink } from "@/components/ui/intent-link";
import { localePath, PAGES } from "@/i18n/locales";
import { hubPath } from "@/lib/seed-lab";
import { LanguageSwitch } from "./language-switch";
import { SeedLabLauncher } from "./seed-lab-launcher";

const footerLink = "flex min-h-11 items-center px-2 text-muted underline-offset-2 hover:text-foreground hover:underline";

/** Header, main and footer around every page, in the page's language. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const { locale, m } = useI18n();
  // A page reached from another language: the document says which one it is now (the first load is set before paint).
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:font-medium"
      >
        {m.site.skip}
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <IntentLink href={localePath("/", locale)} className="flex min-h-11 items-center text-lg font-extrabold tracking-tight">
            {m.site.name}
          </IntentLink>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <SeedLabLauncher />
          </div>
          <div className="w-full sm:order-none sm:w-auto">
            <MainNav />
          </div>
        </div>
      </header>
      <LegacyDataNotice />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 outline-none sm:py-12">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
          <FooterDataControls />
          <p className="text-xs text-muted">{m.site.footerNote}</p>
          <nav aria-label={m.site.footer}>
            <ul className="-mx-2 flex flex-wrap items-center text-sm">
              {(["about", "howItWorks", "privacy", "terms"] as const).map((page) => (
                <li key={page}>
                  <IntentLink href={localePath(PAGES[page], locale)} className={footerLink}>
                    {m[page].title}
                  </IntentLink>
                </li>
              ))}
              <li>
                <a href={hubPath(locale)} className={footerLink}>
                  {m.site.partOf}
                </a>
              </li>
            </ul>
          </nav>
          <p className="text-xs text-muted">{m.site.copyright}</p>
        </div>
      </footer>
    </>
  );
}
