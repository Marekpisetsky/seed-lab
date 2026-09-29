/**
 * Unique id for a new record. `crypto.randomUUID` only exists in secure
 * contexts (HTTPS or localhost), so opening the dev server from a phone on
 * the local network over plain HTTP needs a fallback.
 */
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
