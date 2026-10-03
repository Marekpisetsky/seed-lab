"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * The element's width in CSS pixels, so a chart is drawn at its real size
 * and its text stays legible. Measured before the first paint, so a chart
 * never shows at the fallback size and then jumps.
 */
export function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(Math.round(element.getBoundingClientRect().width) || fallback);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [fallback]);
  return [ref, width] as const;
}
