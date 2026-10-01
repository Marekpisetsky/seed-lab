"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * A link that fetches its page ahead only once someone shows they may go
 * there (a mouse over it, the keyboard on it, a finger down), not because
 * it is on screen: opening one page no longer downloads the others.
 */
export function IntentLink({ onPointerEnter, onFocus, onTouchStart, ...props }: React.ComponentProps<typeof Link>) {
  const [wanted, setWanted] = useState(false);
  return (
    <Link
      {...props}
      prefetch={wanted ? null : false}
      onPointerEnter={(event) => {
        setWanted(true);
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        setWanted(true);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        setWanted(true);
        onTouchStart?.(event);
      }}
    />
  );
}
