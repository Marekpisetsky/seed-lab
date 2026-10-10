"use client";

import { useEffect } from "react";

/**
 * While a dialog is open, the page behind it does not move (on phones
 * too: iOS scrolls the page under a modal unless the body is fixed), and
 * when it closes the page is back exactly where it was.
 */
export function useScrollLock(): void {
  useEffect(() => {
    const { documentElement: root, body } = document;
    const y = window.scrollY;
    const before = { overflow: root.style.overflow, position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right };
    root.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      root.style.overflow = before.overflow;
      body.style.position = before.position;
      body.style.top = before.top;
      body.style.left = before.left;
      body.style.right = before.right;
      window.scrollTo({ top: y, behavior: "instant" });
    };
  }, []);
}
