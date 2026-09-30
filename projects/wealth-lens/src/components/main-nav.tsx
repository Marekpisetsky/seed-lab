"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "My money" },
  { href: "/stocks", label: "My stocks" },
] as const;

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Modules" className="-mx-1 overflow-x-auto">
      <ul className="flex gap-1 text-sm whitespace-nowrap">
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-md px-3 py-2 font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted hover:bg-border/60 hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
