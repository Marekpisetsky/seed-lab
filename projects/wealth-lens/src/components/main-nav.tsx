"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n";
import { IntentLink } from "@/components/ui/intent-link";
import { localePath, PAGES, splitPath } from "@/i18n/locales";

const LINKS = ["money", "test", "stocks"] as const;

export function MainNav() {
  const { locale, m } = useI18n();
  const { path } = splitPath(usePathname() ?? "/");
  return (
    <nav aria-label={m.site.nav.label} className="-mx-1 overflow-x-auto">
      <ul className="flex gap-1 text-sm whitespace-nowrap">
        {LINKS.map((page) => {
          const active = path === PAGES[page];
          return (
            <li key={page}>
              <IntentLink
                href={localePath(PAGES[page], locale)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-md px-2.5 py-2 font-medium transition-colors ${
                  active ? "bg-foreground text-background" : "text-muted hover:bg-border/60 hover:text-foreground"
                }`}
              >
                {m.site.nav[page]}
              </IntentLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
