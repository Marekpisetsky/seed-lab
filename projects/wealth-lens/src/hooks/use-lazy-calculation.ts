"use client";

/**
 * The calculation's code (lib/calculator.ts and everything a result needs:
 * countries, wishes, the plan check, the simulated futures) is not part of
 * the first screen, which only asks: it loads once the user starts using
 * the page, or once there is a plan to show (a file loaded). Until then
 * there is no bundle, and nothing on the first screen needs one.
 */

import { useEffect, useSyncExternalStore } from "react";
import type { CalculationBundle } from "./use-calculation";
import { useAppState } from "./use-app";
import { useToday } from "./use-plan";

type Engine = typeof import("./use-calculation");

let engine: Engine | null = null;
let loading: Promise<Engine> | null = null;
const listeners = new Set<() => void>();

/** Loads the calculation's code once; the pages waiting for it draw again when it is in. */
export function loadCalculation(): Promise<Engine> {
  loading ??= import("./use-calculation").then((module) => {
    engine = module;
    listeners.forEach((listener) => listener());
    return module;
  });
  return loading;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
// The same on the server: the static export never loads it, so the first screen's HTML has no bundle.
const current = () => engine;

/** Everything the page shows, once the calculation's code is in (`wanted` asks for it); `null` before. */
export function useLazyCalculation(wanted: boolean): CalculationBundle | null {
  const state = useAppState();
  const today = useToday();
  const loaded = useSyncExternalStore(subscribe, current, current);
  useEffect(() => {
    if (wanted) void loadCalculation();
  }, [wanted]);
  return loaded ? loaded.calculationFor(state, today) : null;
}
