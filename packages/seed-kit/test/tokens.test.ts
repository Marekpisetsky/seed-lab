import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { BRAND, FAVICON, TOUCH_ICON } from "../src/icons.ts";

/**
 * tokens.css is the one copy every app imports, so these checks run once,
 * here: contrast, neutral greys, the seed green and the icons' colours.
 */

const TOKENS = readFileSync(new URL("../src/tokens.css", import.meta.url), "utf8");
const read = (css: string) => Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/g)].map(([, name, hex]) => [name, hex]));
/** The values of one block of tokens.css, by its selector. */
const block = (selector: string) => {
  const start = TOKENS.indexOf(`${selector} {`);
  return read(TOKENS.slice(start, TOKENS.indexOf("}", start)));
};
const modes = { light: block(".theme-light"), dark: block(".theme-dark") };
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe("the tokens", () => {
  it("keep every text colour at WCAG AA (4.5:1) on every surface, in both modes", () => {
    for (const [mode, t] of Object.entries(modes)) {
      for (const text of ["foreground", "muted", "accent", "positive", "negative", "warning-foreground"]) {
        for (const surface of ["background", "card", "subtle", "warning-bg"]) {
          assert.ok(contrast(t[text], t[surface]) >= 4.5, `${mode}: ${text} on ${surface} is ${contrast(t[text], t[surface]).toFixed(2)}`);
        }
      }
      assert.ok(contrast(t["accent-foreground"], t.accent) >= 4.5, `${mode}: text on an accent button`);
      assert.ok(contrast(t["brand-foreground"], t.brand) >= 4.5, `${mode}: text on a brand button`);
      assert.ok(contrast(t.brand, t.background) >= 3, `${mode}: the logo and icons (3:1 for graphics)`);
      assert.ok(contrast(t.accent, t["accent-soft"]) >= 4.5, `${mode}: a label on its soft tint`);
      assert.ok(contrast(t.background, t.foreground) >= 4.5, `${mode}: the current page in the menus (background on foreground)`);
    }
  });

  it("use neutral greys with no warm tint, and white and near-black behind everything", () => {
    for (const [mode, t] of Object.entries(modes)) {
      for (const grey of ["background", "foreground", "card", "subtle", "muted", "border"]) {
        const [r, g, b] = [1, 3, 5].map((i) => t[grey].slice(i, i + 2));
        assert.ok(r === g && g === b, `${mode}: ${grey} ${t[grey]} is not a neutral grey`);
      }
    }
    assert.equal(modes.light.background, "#ffffff");
    assert.equal(modes.dark.background, "#0a0a0a");
  });

  it("give the device's dark mode the same values as .theme-dark", () => {
    const start = TOKENS.indexOf("@media (prefers-color-scheme: dark)");
    assert.deepEqual(read(TOKENS.slice(start, TOKENS.indexOf(".theme-dark {"))), modes.dark);
  });

  it("are a seed green of their own, far from NVIDIA's yellow-green", () => {
    const hue = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return (h * 60 + 360) % 360;
    };
    for (const t of Object.values(modes)) assert.ok(hue(t.brand) - hue("#76b900") > 60, `${t.brand} is too close to #76b900`);
    assert.equal(modes.light["chart-growth"], modes.light.brand, "growth is drawn in the brand green");
    assert.notEqual(modes.light["chart-put-in"], modes.light.brand);
  });

  it("are the colours of the icons", () => {
    assert.equal(BRAND, modes.light.brand);
    assert.ok(FAVICON.includes(`fill="${BRAND}"`) && TOUCH_ICON.includes(`fill="${BRAND}"`));
    assert.ok(TOUCH_ICON.includes(`fill="${modes.dark.background}"`));
  });

  it("are the only colours of the header and footer", () => {
    const chrome = readFileSync(new URL("../src/chrome.css", import.meta.url), "utf8");
    assert.doesNotMatch(chrome.replace(/rgb\(0 0 0 \/ \.\d+\)/g, ""), /#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
  });
});
