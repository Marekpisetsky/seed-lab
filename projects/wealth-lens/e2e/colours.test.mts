/**
 * Light, dark and colour blindness in a real browser, from the static
 * build (run `npm run build` first). The header's theme menu (seed-kit's
 * theme.ts: the pick lasts for the tab only), the contrast of every text in
 * both modes, and the colours that tell things apart (the chart's two
 * parts, the zones of "Could pay you", gains and losses, the marked start
 * years) as people with deuteranopia, protanopia and tritanopia see them:
 * the browser's own emulation, read back from screenshots.
 */

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";
import { APART, colorsAt, contrastProblems, contrastRatio, deltaE2000, DEFICIENCIES, emulateVision, parseColor, type Rgb } from "../../../packages/seed-kit/src/vision.ts";
import { serve } from "../../../packages/seed-kit/src/serve.ts";

const OUT = fileURLToPath(new URL("../out/", import.meta.url));
const THEMES = ["light", "dark"] as const;

let close = () => {};
let base = "";
let browser: Browser;

before(async () => {
  assert.ok(existsSync(join(OUT, "index.html")), "build first: npm run build");
  ({ base, close } = await serve(OUT));
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  close();
});

/** A page in a mode picked earlier in the tab ("auto": none), on a device in light or dark mode; in a window of its own. */
async function open(path: string, { theme = "auto", device = "light", width = 1366 }: { theme?: string; device?: "light" | "dark"; width?: number } = {}): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width, height: 900 }, locale: "en-GB" })).newPage();
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: device });
  if (theme !== "auto") await page.addInitScript((picked) => sessionStorage.setItem("sk-theme", picked), theme);
  await page.goto(base + path, { waitUntil: "networkidle" });
  return page;
}

async function firstResult(page: Page): Promise<void> {
  await page.getByLabel("How much do you have now?", { exact: true }).fill("20000");
  await page.getByLabel("How much do you add each month?", { exact: true }).fill("400");
  await page.getByRole("button", { name: "See my result" }).click();
  await page.locator('section[aria-label="Result"]').waitFor();
  await page.waitForLoadState("networkidle");
}

const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const WHITE = "rgb(255, 255, 255)";
const NEAR_BLACK = "rgb(10, 10, 10)";

describe("the theme menu", () => {
  it("follows the device until a mode is picked, keeps the pick for the tab only, and Automatic forgets it", async () => {
    const page = await open("/", { device: "dark" });
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "auto");
    assert.equal(await background(page), NEAR_BLACK, "the device's dark mode");
    const menu = page.locator(".sk-actions > .sk-theme");
    await menu.locator("summary").click();
    await menu.getByLabel("Light").check();
    assert.equal(await background(page), WHITE);
    assert.equal(await page.evaluate(() => sessionStorage.getItem("sk-theme")), "light");
    await page.keyboard.press("Escape");
    assert.equal(await menu.evaluate((details) => (details as HTMLDetailsElement).open), false);
    assert.equal(await page.evaluate(() => document.activeElement?.closest(".sk-theme") !== null), true, "the focus goes back to its button");
    // Moving to another page of the app, and coming back: still light.
    await page.getByRole("link", { name: "Español" }).click();
    await page.waitForURL(/\/es$/);
    assert.equal(await background(page), WHITE);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await background(page), WHITE);
    assert.equal(await page.locator(".sk-actions > .sk-theme").getByLabel("Claro").isChecked(), true, "the menu shows the pick");
    // Another tab starts from the device again: nothing is shared or kept elsewhere.
    const other = await page.context().newPage();
    await other.emulateMedia({ colorScheme: "dark" });
    await other.goto(base + "/", { waitUntil: "networkidle" });
    assert.equal(await background(other), NEAR_BLACK);
    assert.deepEqual(await other.evaluate(() => [document.documentElement.dataset.theme, sessionStorage.length, document.cookie, localStorage.length]), ["auto", 0, "", 0]);
    await other.close();
    // Automatic: the device's mode, and the key gone.
    await page.locator(".sk-actions > .sk-theme summary").click();
    await page.locator(".sk-actions > .sk-theme").getByLabel("Automático").check();
    assert.equal(await background(page), NEAR_BLACK);
    assert.equal(await page.evaluate(() => sessionStorage.length), 0);
    await page.context().close();
  });

  it("is in the tools menu on a phone, with nothing in the header moving or overflowing", async () => {
    for (const path of ["/", "/es"]) {
      const page = await open(path, { width: 360 });
      assert.equal(await page.locator(".sk-actions > .sk-theme").isVisible(), false);
      const row = await page.evaluate(() => {
        const brand = document.querySelector(".sk-brand")!.getBoundingClientRect();
        const actions = document.querySelector(".sk-actions")!.getBoundingClientRect();
        return { oneRow: Math.abs(brand.top - actions.top) < 8, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.deepEqual(row, { oneRow: true, overflow: false }, path);
      await page.locator(".sk-launcher summary").click();
      const choices = page.locator(".sk-panel-theme");
      assert.equal(await choices.isVisible(), true);
      const targets = await choices.locator("label").evaluateAll((labels) => labels.map((label) => label.getBoundingClientRect().height));
      assert.ok(targets.every((height) => height >= 44), `44 px targets: ${targets}`);
      await choices.locator("input[value=dark]").check();
      assert.equal(await background(page), NEAR_BLACK);
      await page.context().close();
    }
  });
});

describe("contrast in both modes", () => {
  it("keeps every text at WCAG AA: the first screen, the result with its sections open, Check your plan, Test my plan and Privacy", async () => {
    for (const theme of THEMES) {
      const page = await open("/", { theme });
      const problems: string[] = [];
      const check = async (where: string) => {
        for (const problem of await contrastProblems(page)) problems.push(`${theme} ${where}: “${problem.text}” ${problem.ratio} < ${problem.needed} (${problem.color} on ${problem.background})`);
      };
      await check("first screen");
      await firstResult(page);
      await check("result");
      await page.getByRole("button", { name: /^Could pay you each month/ }).click();
      await page.locator("input[type=range]").waitFor();
      await check("Could pay you");
      // Check your plan, which shows only when something stands out: a 3-year plan.
      const years = page.getByLabel("For how many years?", { exact: true }).first();
      await years.fill("3");
      await years.press("Enter");
      await page.getByRole("region", { name: "Check your plan" }).waitFor();
      await check("Check your plan");
      for (const [path, name] of [
        ["/test", "Test my plan"],
        ["/privacy", "Privacy"],
      ] as const) {
        await page.getByRole("link", { name, exact: true }).first().click();
        await page.waitForURL(new RegExp(`${path}$`));
        await page.waitForLoadState("networkidle");
        if (path === "/test") await page.getByRole("button", { name: /^Financial crisis/ }).click();
        await check(name);
      }
      assert.deepEqual(problems, []);
      await page.context().close();
    }
  });
});

/** The pairs of colours that must stay apart, with the colours of each, as the screen shows them. */
type Swatches = Record<string, { x: number; y: number }>;

/** Where, in the growth chart, what you put in and the growth are drawn: the middle of each band, near the end. */
async function chartPoints(page: Page): Promise<Swatches> {
  return page.evaluate(() => {
    const putIn = document.querySelector('path[fill="var(--chart-put-in)"]')!;
    // In sight first: what is under the big number can push it below the fold.
    putIn.closest("svg")!.scrollIntoView({ block: "center" });
    const svg = putIn.closest("svg")!.getBoundingClientRect();
    const x = svg.left + svg.width * 0.8;
    const runs: Record<string, number[]> = { putIn: [], growth: [] };
    for (let y = svg.top; y < svg.bottom; y += 1) {
      const fill = document.elementFromPoint(x, y)?.getAttribute("fill");
      if (fill === "var(--chart-put-in)") runs.putIn.push(y);
      if (fill === "var(--chart-growth)") runs.growth.push(y);
    }
    const middle = (ys: number[]) => ({ x, y: ys[Math.floor(ys.length / 2)] });
    return { "what you put in": middle(runs.putIn), growth: middle(runs.growth) };
  });
}

/** Solid squares of these colours over the page, at fixed places: for colours a page shows only as thin text or borders. */
async function squares(page: Page, colors: Record<string, string>): Promise<Swatches> {
  return page.evaluate((list) => {
    const box = document.createElement("div");
    box.id = "swatches";
    box.style.cssText = "position:fixed;left:0;top:0;z-index:99;display:flex;gap:8px;padding:8px;background:var(--card)";
    const points: Record<string, { x: number; y: number }> = {};
    Object.entries(list).forEach(([name, color], index) => {
      const square = document.createElement("div");
      square.style.cssText = `width:32px;height:32px;background:${color}`;
      box.append(square);
      points[name] = { x: 8 + index * 40 + 16, y: 24 };
    });
    document.body.append(box);
    return points;
  }, colors);
}

/** Every pair of these colours, under each kind of colour vision: the pairs closer than APART. */
async function tooClose(page: Page, points: Swatches, pairs: readonly (readonly [string, string])[]): Promise<string[]> {
  const names = Object.keys(points);
  const close: string[] = [];
  for (const vision of ["none", ...DEFICIENCIES] as const) {
    await emulateVision(page, vision);
    const colors = await colorsAt(page, names.map((name) => points[name]));
    const seen = Object.fromEntries(names.map((name, index) => [name, colors[index]])) as Record<string, Rgb>;
    for (const [a, b] of pairs) {
      const distance = deltaE2000(seen[a], seen[b]);
      if (distance < APART) close.push(`${vision}: ${a} and ${b} are ${distance.toFixed(1)} apart`);
    }
  }
  await emulateVision(page, "none");
  return close;
}

describe("colour blindness", () => {
  for (const theme of THEMES) {
    it(`keeps the chart's two parts, the three zones and gains from losses apart, for every kind of colour vision (${theme})`, async () => {
      const page = await open("/", { theme });
      await firstResult(page);
      const chart = await chartPoints(page);
      assert.ok(chart["what you put in"].y && chart.growth.y, "both parts of the chart are drawn");
      const card = await page.evaluate(() => {
        const svg = document.querySelector('path[fill="var(--chart-put-in)"]')!.closest("svg")!.getBoundingClientRect();
        return { x: svg.left + 4, y: svg.top + 2 };
      });
      const close = await tooClose(page, { ...chart, card }, [
        ["what you put in", "growth"],
        ["what you put in", "card"],
        ["growth", "card"],
      ]);
      // Each part of the chart at 3:1 or more on the card (WCAG 1.4.11).
      const [putIn, growth, behind] = await colorsAt(page, [chart["what you put in"], chart.growth, card]);
      for (const [name, color] of [
        ["what you put in", putIn],
        ["growth", growth],
      ] as const) {
        assert.ok(contrastRatio(color, behind) >= 3, `${theme}: ${name} on the card is ${contrastRatio(color, behind).toFixed(2)}`);
      }
      // The zones' colours, as the page draws them: the slider from 2 % to 7 %, a step at a time, through all three.
      await page.getByRole("button", { name: /^Could pay you each month/ }).click();
      const slider = page.locator("input[type=range]");
      await slider.waitFor();
      await slider.focus();
      await page.keyboard.press("Home");
      const zones: Record<string, string> = {};
      for (let step = 0; step <= 10; step += 1) {
        const badge = page.locator("span.rounded-full.border").filter({ hasText: /^(Prudent|Risky|Very risky)$/ });
        const [zone, color] = await badge.evaluate((element) => [element.textContent!.trim().toLowerCase(), getComputedStyle(element).color]);
        zones[zone] = color;
        await page.keyboard.press("ArrowRight");
      }
      assert.deepEqual(Object.keys(zones).sort(), ["prudent", "risky", "very risky"], "the slider goes through the three zones");
      const tokens = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return { gain: style.getPropertyValue("--positive").trim(), loss: style.getPropertyValue("--negative").trim() };
      });
      assert.notDeepEqual(parseColor(zones.prudent), parseColor(zones["very risky"]));
      const points = await squares(page, { ...zones, ...tokens });
      close.push(
        ...(await tooClose(page, points, [
          ["prudent", "risky"],
          ["prudent", "very risky"],
          ["risky", "very risky"],
          ["gain", "loss"],
        ])),
      );
      assert.deepEqual(close, []);
      await page.context().close();
    });

    it(`keeps the worst, middle and best start years apart from each other and from the rest (${theme})`, async () => {
      const page = await open("/", { theme });
      await firstResult(page);
      await page.getByRole("link", { name: "Test my plan", exact: true }).first().click();
      await page.waitForURL(/\/test$/);
      await page.waitForLoadState("networkidle");
      const chart = page.locator("section[aria-labelledby=every-title] svg[role=img]");
      await chart.scrollIntoViewIfNeeded();
      const bars = await chart.evaluate((svg) => {
        const centre = (fill: string) => {
          const box = svg.querySelector(`rect[fill="${fill}"]`)!.getBoundingClientRect();
          return { x: box.left + box.width / 2, y: box.bottom - 4 };
        };
        return { worst: centre("var(--negative)"), middle: centre("var(--foreground)"), best: centre("var(--positive)"), other: centre("var(--chart-put-in)") };
      });
      const close = await tooClose(page, bars, [
        ["worst", "middle"],
        ["worst", "best"],
        ["middle", "best"],
        ["worst", "other"],
        ["middle", "other"],
        ["best", "other"],
      ]);
      assert.deepEqual(close, []);
      // And never by colour alone: each marked year has its own shape over its bar.
      assert.equal(await chart.locator("path[fill='var(--negative)'], path[fill='var(--foreground)'], path[fill='var(--positive)']").count(), 3);
      await page.context().close();
    });
  }
});
