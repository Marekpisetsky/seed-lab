/**
 * The kit's style sheets, for static apps that put their CSS inside each
 * page (one request less, no flash): read them, add the app's own, and
 * take out comments and spare spaces. Node only (it reads files).
 */

import { readFileSync } from "node:fs";

/** The style sheets of the kit: the colours, the header and footer, and the base of a web tool. */
export type KitCss = "tokens.css" | "chrome.css" | "base.css";

export function kitCss(...names: KitCss[]): string {
  return names.map((name) => readFileSync(new URL(name, import.meta.url), "utf8")).join("\n");
}

/** CSS without comments and spare spaces. Plain CSS only: no strings holding "{", ";" or "/*". */
export function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};:,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}
