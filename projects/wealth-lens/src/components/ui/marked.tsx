"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n";
import { localePath } from "@/i18n/locales";
import { SEED_LAB_HUB_URL } from "@/lib/seed-lab";
import { Email } from "./email";

/** Link names a dictionary may use instead of an address: "[seed-lab](hub)". */
const NAMED_LINKS: Readonly<Record<string, string>> = {
  hub: SEED_LAB_HUB_URL,
};

/** Inside a sentence: the padding makes a 44 px tall area for a finger without moving the text around it. */
const linkClass = "py-3 font-medium text-accent underline underline-offset-2";

/**
 * A dictionary sentence with its key figure marked "**like this**" (bold,
 * so each language places it where its words need it) and links written
 * "[words](/page)", "[words](https://…)" or "[words](hub)". A page of
 * the site ("/privacy") opens in the page's language. "[email](email)" is
 * seed-lab's email address, joined only in the browser (ui/email.tsx).
 */
export function Marked({ text, strongClassName = "font-medium text-foreground tabular-nums" }: { text: string; strongClassName?: string }) {
  const { locale } = useI18n();
  return (
    <>
      {text.split(/(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\))/).map((part, index) => {
        const bold = /^\*\*(.+)\*\*$/.exec(part);
        if (bold) {
          return (
            <strong key={index} className={strongClassName}>
              {bold[1]}
            </strong>
          );
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (!link) return part;
        const [, words, target] = link;
        if (target === "email") return <Email key={index} className={linkClass} />;
        if (target.startsWith("/")) {
          return (
            <Link key={index} href={localePath(target, locale)} className={linkClass}>
              {words}
            </Link>
          );
        }
        return (
          <a key={index} href={NAMED_LINKS[target] ?? target} className={linkClass} rel="noopener">
            {words}
          </a>
        );
      })}
    </>
  );
}
