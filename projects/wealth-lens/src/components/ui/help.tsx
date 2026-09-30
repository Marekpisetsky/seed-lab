"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";

/**
 * A small "?" beside an important number: tapping it says in one sentence
 * what the number means. The circle is small; the area that answers a
 * finger is 44 px, like every other control.
 */
export function Help({ what, text, align = "start" }: { what: string; text: string; align?: "start" | "end" }) {
  const { m } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <span ref={root} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={m.help.button(what)}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        className="-m-3 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-foreground"
      >
        <span aria-hidden="true" className="inline-flex size-5 items-center justify-center rounded-full border border-current text-xs font-semibold">
          ?
        </span>
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className={`absolute top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card px-3 py-2 text-left text-sm font-normal tracking-normal text-foreground shadow-lg ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
