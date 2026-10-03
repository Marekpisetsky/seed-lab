"use client";

import { currentTheme, subscribeTheme } from "@seed-kit/theme.ts";
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  const stop = subscribeTheme(onChange);
  return () => {
    media.removeEventListener("change", onChange);
    stop();
  };
}

/** "dark" or "light": the mode picked in the header for this tab, or else the device's (seed-kit's theme.ts). */
export function useColorScheme(): "dark" | "light" {
  return useSyncExternalStore(
    subscribe,
    () => {
      const theme = currentTheme();
      return theme === "auto" ? (window.matchMedia(QUERY).matches ? "dark" : "light") : theme;
    },
    () => "light",
  );
}
