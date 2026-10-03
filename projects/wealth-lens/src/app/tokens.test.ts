import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The seed-lab tokens: Wealth Lens imports seed-kit's tokens.css, the one
 * file every app uses (its own tests check contrast and dark mode). The
 * icon and the share image cannot read CSS variables, so they repeat the
 * seed green and the dark band's colours: these tests keep them equal.
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const TOKENS = read("../../../../packages/seed-kit/src/tokens.css");
/** The values of the block of tokens.css one selector belongs to (a block can have several: ".theme-light", ':root[data-theme="light"] .theme-dark'…). */
function block(selector: string): Record<string, string> {
  const found = [...TOKENS.matchAll(/([^{}]+)\{([^{}]*--background[^{}]*)\}/g)].find(([, selectors]) => selectors.split(/,\s*/).map((part) => part.trim()).includes(selector));
  return Object.fromEntries([...(found?.[2] ?? "").matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/g)].map(([, name, hex]) => [name, hex]));
}
const LIGHT = block(".theme-light");
const DARK = block(".theme-dark");

describe("tokens", () => {
  it("are the only colours of the globals, the icon and the share image", () => {
    expect(read("./globals.css")).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(read("./icon.svg")).toContain(`fill="${LIGHT.brand}"`);
    const og = read("./og.png/route.tsx");
    for (const name of ["background", "foreground", "muted"]) expect(og).toContain(`${name}: "${DARK[name]}"`);
    expect(og).toContain(`brand: "${LIGHT.brand}"`);
  });

  it("draw growth in the brand green and what you put in in the secondary blue", () => {
    expect(LIGHT["chart-growth"]).toBe(LIGHT.brand);
    expect(DARK["chart-growth"]).toBe(LIGHT.brand);
    expect(LIGHT["chart-put-in"]).not.toBe(LIGHT.brand);
  });
});
