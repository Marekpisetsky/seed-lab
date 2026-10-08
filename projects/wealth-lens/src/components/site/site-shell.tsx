"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { footerModel, headerModel } from "@seed-kit/chrome.ts";
import { SiteFooter, SiteHeader } from "@seed-kit/react/chrome.tsx";
import { FooterDataControls } from "@/components/data-controls";
import { useI18n } from "@/components/i18n";
import { LegacyDataNotice } from "@/components/legacy-data-notice";
import { IntentLink } from "@/components/ui/intent-link";
import { LOCALES, localePath, PAGES, splitPath } from "@/i18n/locales";
import type { Locale } from "@/i18n/locales";

/** The pages in the header, and the ones in the footer. */
const NAV = ["money", "test", "stocks"] as const;
const FOOTER = ["about", "howItWorks", "privacy", "terms"] as const;

/**
 * Header, main and footer around every page, in the page's language. The
 * header and footer are seed-lab's, from seed-kit (packages/seed-kit): the
 * seed and the name, the pages, EN/ES, the tools launcher, the links and
 * "Part of seed-lab". Links inside the site go through IntentLink, so
 * moving between pages and languages keeps the plan typed so far.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const { locale, m } = useI18n();
  const { path } = splitPath(usePathname() ?? "/");
  // A page reached from another language: the document says which one it is now (the first load is set before paint).
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const header = headerModel({
    locale,
    name: m.site.name,
    homeHref: localePath("/", locale),
    nav: NAV.map((page) => ({ label: m.site.nav[page], href: localePath(PAGES[page], locale), current: path === PAGES[page] })),
    languageHrefs: Object.fromEntries(LOCALES.map((other) => [other, localePath(path, other)])) as Record<Locale, string>,
    current: "wealth-lens",
  });
  const footer = footerModel({
    locale,
    links: FOOTER.map((page) => ({ label: m.site.footer[page], href: localePath(PAGES[page], locale) })),
    notes: [m.site.footerNote],
  });
  return (
    <>
      <SiteHeader model={header} Link={IntentLink} />
      <LegacyDataNotice />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-(--sk-width) flex-1 px-4 py-8 outline-none sm:py-12">
        {children}
      </main>
      <SiteFooter model={footer} Link={IntentLink}>
        <FooterDataControls />
      </SiteFooter>
    </>
  );
}
