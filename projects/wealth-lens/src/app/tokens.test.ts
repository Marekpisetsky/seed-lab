import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The seed-lab tokens: Wealth Lens and the hub share one tokens.css, byte
 * for byte, so both sites look like one family. The icon and the share
 * image cannot read CSS variables, so they repeat the light values: these
 * tests keep them equal.
 */

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const TOKENS = read("./tokens.css");
const LIGHT = Object.fromEntries(
  [...TOKENS.split("@media")[0].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/g)].map(([, name, hex]) => [name, hex]),
);

describe("tokens", () => {
  it("are the same file as the hub's", () => {
    expect(read("../../../../hub/src/tokens.css")).toBe(TOKENS);
  });

  it("are the only colours of the globals, the icon and the share image", () => {
    expect(read("./globals.css")).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(read("./icon.svg")).toContain(`fill="${LIGHT.accent}"`);
    const og = read("./og.png/route.tsx");
    for (const name of ["background", "foreground", "muted", "accent"]) {
      expect(og).toContain(`${name}: "${LIGHT[name]}"`);
    }
  });
});
