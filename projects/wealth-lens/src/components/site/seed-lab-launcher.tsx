"use client";

import { Check, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { localePath } from "@/i18n/locales";
import { SEED_LAB_HUB_URL, SEED_LAB_PROJECTS } from "@/lib/seed-lab";

/**
 * The seed-lab launcher: a small grid button that opens the family's
 * projects, like an app launcher. Quiet on purpose: the calculator comes
 * first. The hub's address and the list come from lib/seed-lab.ts and
 * src/data/seed-lab-projects.json.
 */
export function SeedLabLauncher() {
  const { locale, m } = useI18n();
  const t = m.launcher;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={t.open}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className={`flex size-11 items-center justify-center rounded-md border border-border ${open ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
      >
        <LayoutGrid aria-hidden="true" className="size-5" />
      </button>
      <div
        id={id}
        hidden={!open}
        className="absolute right-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-2 shadow-lg"
      >
        <a href={SEED_LAB_HUB_URL} rel="noopener" className="flex min-h-11 flex-col justify-center rounded-lg px-3 py-2 hover:bg-border/40">
          <span className="font-semibold">{m.site.seedLab}</span>
          <span className="text-xs text-muted">{t.hub}</span>
        </a>
        <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted">{t.projects}</p>
        <ul>
          {SEED_LAB_PROJECTS.map((project) => {
            const content = (
              <>
                <span className="flex-1 font-medium">{project.name}</span>
                {project.current && (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Check aria-hidden="true" className="size-3.5" />
                    {t.current}
                  </span>
                )}
              </>
            );
            const className = "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 hover:bg-border/40";
            return (
              <li key={project.id}>
                {project.url.startsWith("/") ? (
                  <Link href={localePath(project.url, locale)} aria-current={project.current ? "true" : undefined} onClick={() => setOpen(false)} className={className}>
                    {content}
                  </Link>
                ) : (
                  <a href={project.url} rel="noopener" className={className}>
                    {content}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
