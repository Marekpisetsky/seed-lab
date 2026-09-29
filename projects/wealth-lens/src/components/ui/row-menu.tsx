"use client";

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

/** A "⋯" button with a small menu, so row actions don't clutter the list. */
export function RowMenu({ label, items }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-lg leading-none text-muted hover:bg-border/60 hover:text-foreground"
      >
        ⋯
      </button>
      {open && (
        <ul
          id={menuId}
          role="menu"
          className="absolute right-0 z-10 mt-1 min-w-44 overflow-hidden rounded-lg border border-border bg-card py-1 text-sm shadow-lg"
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`block w-full px-4 py-2 text-left hover:bg-border/40 ${item.tone === "danger" ? "text-negative" : ""}`}
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
