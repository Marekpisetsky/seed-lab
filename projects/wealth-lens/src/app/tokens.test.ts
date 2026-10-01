import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The seed-lab tokens: Wealth Lens and the hub share one tokens.css, byte
 * for byte, so both sites look like one family. The icon and the share
 * image cannot read CSS variables, so they repeat the seed green and the
 * dark band's colours: these tests keep them equal.
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const TOKENS = read("./tokens.css");
/** The values of one block of tokens.css, by its selector. */
function block(selector: string): Record<string, string> {
  const start = TOKENS.indexOf(`${selector} {`);
  const body = TOKENS.slice(start, TOKENS.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/g)].map(([, name, hex]) => [name, hex]));
}
const LIGHT = block(".theme-light");
const DARK = block(".theme-dark");

describe("tokens", () => {
  it("are the same file as the hub's", () => {
    expect(read("../../../../hub/src/tokens.css")).toBe(TOKENS);
  });

  it("give the device's dark mode the same values as .theme-dark", () => {
    const media = TOKENS.slice(TOKENS.indexOf("@media (prefers-color-scheme: dark)"), TOKENS.indexOf(".theme-dark {"));
    const values = Object.fromEntries([...media.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/g)].map(([, name, hex]) => [name, hex]));
    expect(values).toEqual(DARK);
  });

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
