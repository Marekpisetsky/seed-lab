"use client";

import { useState } from "react";

/**
 * A figure that is marked for a moment when it changes, so the user sees
 * what their change did, and only that. Never on the first render: a page
 * that just appeared has nothing to point at.
 */
export function Changed({ value, className = "" }: { value: string; className?: string }) {
  const [seen, setSeen] = useState(value);
  const [times, setTimes] = useState(0);
  const [fresh, setFresh] = useState(false);
  // Compared while rendering (React's pattern for "what it was last time"): no extra render pass.
  if (seen !== value) {
    setSeen(value);
    setTimes(times + 1);
    setFresh(true);
  }
  // A new key restarts the fade when it changes again before the last one ended.
  return (
    <span
      key={times}
      data-changed={fresh || undefined}
      onAnimationEnd={() => setFresh(false)}
      className={`rounded-sm ${fresh ? "animate-changed" : ""} ${className}`}
    >
      {value}
    </span>
  );
}
