/**
 * Applies a typed value once the user has finished: after `delay` ms
 * without another keystroke, or at once when they leave the field or press
 * Enter. The values on the way ("1", "10", "100" while typing "1000") are
 * never applied, so nothing on the screen moves while they type.
 */

export const SETTLE_DELAY_MS = 500;

export interface Timers {
  set: (callback: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
}

const browserTimers: Timers = {
  set: (callback, ms) => setTimeout(callback, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface Settler<T> {
  /** A new value was typed: apply it after the delay, unless another comes first. */
  typed(value: T): void;
  /** The user is done (blur, Enter): apply a pending value now. */
  flush(): void;
  /** Drop a pending value (the text no longer reads as a valid one). */
  cancel(): void;
}

export function createSettler<T>(apply: (value: T) => void, delay = SETTLE_DELAY_MS, timers: Timers = browserTimers): Settler<T> {
  let handle: unknown = null;
  let pending: { value: T } | null = null;
  const stop = () => {
    if (handle !== null) timers.clear(handle);
    handle = null;
  };
  const flush = () => {
    stop();
    if (!pending) return;
    const { value } = pending;
    pending = null;
    apply(value);
  };
  return {
    typed(value) {
      pending = { value };
      stop();
      handle = timers.set(flush, delay);
    },
    flush,
    cancel() {
      stop();
      pending = null;
    },
  };
}
