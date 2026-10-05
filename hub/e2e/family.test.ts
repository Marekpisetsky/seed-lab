/**
 * The static seed-lab family in a real browser: the hub and the tools
 * Forja makes (Cost Lens, Inflation Lens), from their builds (run each
 * one's `npm run build` first). The header's theme menu, run by seed-kit's
 * theme script with no framework; the contrast of every text in light and
 * dark; and Inflation Lens's timeline as people with deuteranopia,
 * protanopia and tritanopia see it (the browser's own emulation). Wealth
 * Lens has its own (projects/wealth-lens/e2e).
 */

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";
import { serve } from "../../packages/seed-kit/src/serve.ts";
import { APART, colorsAt, contrastProblems, contrastRatio, deltaE2000, DEFICIENCIES, emulateVision, type Rgb } from "../../packages/seed-kit/src/vision.ts";

const SITES = {
  hub: { folder: "../dist/", pages: ["/", "/principles/", "/about/", "/roadmap/", "/es/", "/es/principles/", "/es/about/", "/es/roadmap/", "/404.html"] },
  "cost-lens": { folder: "../../projects/cost-lens/dist/", pages: ["/", "/privacy/", "/es/", "/es/privacy/"] },
  "inflation-lens": { folder: "../../projects/inflation-lens/dist/", pages: ["/", "/privacy/", "/es/", "/es/privacy/"] },
} as const;
type Site = keyof typeof SITES;

const bases = {} as Record<Site, string>;
const closes: (() => void)[] = [];
let browser: Browser;

before(async () => {
  for (const [site, { folder }] of Object.entries(SITES) as [Site, (typeof SITES)[Site]][]) {
    const path = fileURLToPath(new URL(folder, import.meta.url));
    assert.ok(existsSync(`${path}index.html`), `build ${site} first`);
    const { base, close } = await serve(path);
    bases[site] = base;
    closes.push(close);
  }
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  for (const close of closes) close();
});

async function open(site: Site, path: string, { theme = "auto", device = "light", width = 1366, scripts = true }: { theme?: string; device?: "light" | "dark"; width?: number; scripts?: boolean } = {}): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: scripts, colorScheme: device, reducedMotion: "reduce" });
  const page = await context.newPage();
  if (theme !== "auto") await page.addInitScript((picked) => sessionStorage.setItem("sk-theme", picked), theme);
  await page.goto(bases[site] + path, { waitUntil: "networkidle" });
  return page;
}

const background = (page: Page, selector = "body") => page.locator(selector).first().evaluate((element) => getComputedStyle(element).backgroundColor);
const WHITE = "rgb(255, 255, 255)";
const NEAR_BLACK = "rgb(10, 10, 10)";

describe("the theme menu, with no framework", () => {
  for (const site of Object.keys(SITES) as Site[]) {
    it(`picks a mode for the tab, shows it in every copy, closes like a menu, and forgets it on Automatic (${site})`, async () => {
      const page = await open(site, "/es/", { device: "dark" });
      const menu = page.locator(".sk-actions > .sk-theme");
      await menu.locator("summary").click();
      await menu.getByLabel("Claro").check();
      assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
      assert.equal(await background(page), WHITE);
      assert.equal(await page.locator(".sk-panel-theme input[value=light]").isChecked(), true, "the launcher's copy too");
      // One menu at a time; Escape closes it and gives the focus back.
      await page.locator(".sk-launcher summary").click();
      assert.equal(await menu.evaluate((details) => (details as HTMLDetailsElement).open), false);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator(".sk-launcher").evaluate((details) => (details as HTMLDetailsElement).open), false);
      assert.equal(await page.evaluate(() => document.activeElement?.closest(".sk-launcher") !== null), true);
      // Another page of the same site, in the same tab: still light, before anything is painted.
      await page.goto(bases[site] + (site === "hub" ? "/es/about/" : "/es/privacy/"), { waitUntil: "networkidle" });
      assert.equal(await background(page), WHITE);
      assert.equal(await page.locator(".sk-actions > .sk-theme input[value=light]").isChecked(), true);
      // Automatic: the device's dark mode again, and nothing kept.
      await page.locator(".sk-actions > .sk-theme summary").click();
      await page.locator(".sk-actions > .sk-theme").getByLabel("Automático").check();
      assert.equal(await background(page), NEAR_BLACK);
      assert.deepEqual(await page.evaluate(() => [sessionStorage.length, localStorage.length, document.cookie]), [0, 0, ""]);
      await page.context().close();
    });
  }

  it("turns the hub's dark and light bands into the mode picked, and its bar colour with them", async () => {
    const page = await open("hub", "/", { theme: "light" });
    assert.equal(await background(page, ".band.theme-dark"), WHITE);
    assert.equal(await page.locator('meta[name="theme-color"]').getAttribute("content"), "#ffffff");
    await page.context().close();
    const dark = await open("hub", "/", { theme: "dark" });
    assert.equal(await background(dark, ".band.theme-light"), NEAR_BLACK);
    await dark.context().close();
    const auto = await open("hub", "/");
    assert.equal(await background(auto, ".band.theme-dark"), NEAR_BLACK, "the bands as designed, on Automatic");
    assert.equal(await background(auto, ".band.theme-light"), WHITE);
    await auto.context().close();
  });

  it("is not there without scripts, and the page follows the device", async () => {
    for (const site of Object.keys(SITES) as Site[]) {
      const page = await open(site, "/", { device: "dark", scripts: false });
      assert.equal(await page.locator(".sk-theme").first().isVisible(), false, site);
      await page.locator(".sk-launcher summary").click();
      assert.equal(await page.locator(".sk-panel-theme").isVisible(), false, site);
      assert.notEqual(await background(page), WHITE, site);
      await page.context().close();
    }
  });
});

describe("contrast in both modes", () => {
  it("keeps every text at WCAG AA on every page, light and dark, and on Automatic with the hub's bands", async () => {
    const problems: string[] = [];
    for (const [site, { pages }] of Object.entries(SITES) as [Site, (typeof SITES)[Site]][]) {
      for (const path of pages) {
        for (const theme of ["auto", "light", "dark"]) {
          const page = await open(site, path, { theme, width: 1366 });
          // The whole page, a screen at a time.
          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          for (let top = 0; top < height; top += 800) {
            await page.evaluate((y) => window.scrollTo(0, y), top);
            for (const problem of await contrastProblems(page)) problems.push(`${site}${path} ${theme}: “${problem.text}” ${problem.ratio} < ${problem.needed} (${problem.color} on ${problem.background})`);
          }
          await page.context().close();
        }
      }
    }
    assert.deepEqual([...new Set(problems)], []);
  });
});

describe("colour blindness", () => {
  for (const theme of ["light", "dark"] as const) {
    it(`keeps Inflation Lens's years since the chosen one apart from the others, and both from the card (${theme})`, async () => {
      const page = await open("inflation-lens", "/", { theme });
      const timeline = page.locator("svg.timeline");
      await timeline.scrollIntoViewIfNeeded();
      const points = await timeline.evaluate((svg) => {
        const centre = (rect: Element) => {
          const box = rect.getBoundingClientRect();
          return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
        };
        const tallest = (kind: string) => Array.from(svg.querySelectorAll(`rect.${kind}`)).sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
        const box = svg.getBoundingClientRect();
        return { since: centre(tallest("in")), before: centre(tallest("out")), card: { x: box.left + 2, y: box.top + 2 } };
      });
      const names = Object.keys(points) as (keyof typeof points)[];
      const close: string[] = [];
      for (const vision of ["none", ...DEFICIENCIES] as const) {
        await emulateVision(page, vision);
        const colors = Object.fromEntries((await colorsAt(page, names.map((name) => points[name]))).map((color, index) => [names[index], color])) as Record<string, Rgb>;
        if (vision === "none") {
          // Bars one needs to read: 3:1 or more on the card (WCAG 1.4.11).
          for (const bar of ["since", "before"] as const) assert.ok(contrastRatio(colors[bar], colors.card) >= 3, `${bar}: ${contrastRatio(colors[bar], colors.card).toFixed(2)}`);
        }
        for (const [a, b] of [
          ["since", "before"],
          ["since", "card"],
          ["before", "card"],
        ] as const) {
          const distance = deltaE2000(colors[a], colors[b]);
          if (distance < APART) close.push(`${vision}: ${a} and ${b} are ${distance.toFixed(1)} apart`);
        }
      }
      assert.deepEqual(close, []);
      // And not by colour alone: a dashed line where "since" begins, in the legend too.
      assert.equal(await timeline.locator("line.since").count(), 1);
      assert.equal(await page.locator(".legend .edge").count(), 1);
      await page.context().close();
    });
  }
});
