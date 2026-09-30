"use client";

import { Ellipsis } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export interface RowMenuItem {
  label: string;
  onSelect: () => void;
  tone?: "danger";
}

interface RowMenuProps {
  /** Accessible name of the button, e.g. "Actions for VWCE". */
  label: string;
  items: RowMenuItem[];
}

/**
 * A "more" button that shows a row's actions, so they don't clutter the
 * list. A plain disclosure (a button that opens a list of buttons), which
 * works the same with a mouse, a finger, Tab or a screen reader: opening it
 * moves focus to the first action; Escape, or focus leaving it, closes it
 * and Escape brings focus back to the button.
 */
export function RowMenu({ label, items }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector("button")?.focus();
    const outside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (open && !rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 items-center justify-center rounded-md text-muted hover:bg-border/60 hover:text-foreground"
      >
        <Ellipsis aria-hidden="true" className="size-5" />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          aria-label={label}
          className="absolute right-0 z-10 mt-1 min-w-44 overflow-hidden rounded-lg border border-border bg-card py-1 text-sm shadow-lg"
        >
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`block min-h-11 w-full px-4 py-2 text-left hover:bg-border/40 ${item.tone === "danger" ? "text-negative" : ""}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
