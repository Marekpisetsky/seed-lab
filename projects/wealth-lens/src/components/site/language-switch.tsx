"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n";
import { LOCALE_SETTINGS, LOCALES, localePath, splitPath } from "@/i18n/locales";

/**
 * EN · ES: the same page in the other language. A link inside the site, so
 * the plan typed so far stays (it lives in memory, not in the address).
 */
export function LanguageSwitch() {
  const { locale, m } = useI18n();
  const { path } = splitPath(usePathname() ?? "/");
  return (
    <nav aria-label={m.site.language}>
      <ul className="flex rounded-md border border-border p-0.5 text-sm">
        {LOCALES.map((option) => {
          const settings = LOCALE_SETTINGS[option];
          const current = option === locale;
          return (
            <li key={option}>
              <Link
                href={localePath(path, option)}
                hrefLang={option}
                lang={option}
                title={settings.name}
                aria-current={current ? "true" : undefined}
                aria-label={settings.name}
                className={`flex min-h-11 min-w-11 items-center justify-center rounded px-2 font-medium ${
                  current ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                }`}
              >
                {settings.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
