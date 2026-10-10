"use client";

import { useCallback, useEffect, useState } from "react";

/** How long a value shown by a finger stays without the finger: then it goes, as a tooltip should. */
export const TOUCH_TIP_MS = 4000;

/**
 * The value a chart shows under the mouse or the finger. A mouse shows it
 * while it is over the chart. A finger leaves it shown after lifting, so
 * it can be read, but it goes on a tap outside the chart, on any scroll,
 * and after TOUCH_TIP_MS: it never stays stuck over the page.
 */
export function useTouchTip<T extends Element>(frame: React.RefObject<T | null>): [number | null, (value: number | null, pointerType?: string) => void] {
  const [value, setValue] = useState<number | null>(null);
  const [byTouch, setByTouch] = useState(false);
  const set = useCallback((next: number | null, pointerType?: string) => {
    setValue(next);
    if (next !== null) setByTouch(pointerType !== undefined && pointerType !== "mouse");
  }, []);
  useEffect(() => {
    if (value === null || !byTouch) return;
    const hide = () => setValue(null);
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !frame.current?.contains(event.target)) hide();
    };
    const timer = window.setTimeout(hide, TOUCH_TIP_MS);
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("scroll", hide, { capture: true });
    };
  }, [value, byTouch, frame]);
  return [value, set];
}
