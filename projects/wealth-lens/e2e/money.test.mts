/**
 * "My money" in a real browser, from the static build (out/: run
 * `npm run build` first, then `npm run test:browser`). What only a browser
 * can tell: the steps keep their size in every language, the result's three
 * layouts by width, the bottom sheet on a phone, the button only the first
 * time, step 3's examples, and that everything can be tapped with a finger.
 * Nothing is sent anywhere: the page is served from this machine.
 */

import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";

const OUT = fileURLToPath(new URL("../out/", import.meta.url));
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".txt": "text/plain", ".ico": "image/x-icon" };

const WORDS = {
  en: { path: "/", have: "How much do you have now?", monthly: "How much do you add each month?", growth: "How much does it grow each year?", years: "For how many years?", see: "See my result", edit: "Edit", done: "Done", more: "€50 more a month", sp500: /^S&P 500,/, world: /^World,/, result: "Result" },
  es: { path: "/es", have: "¿Cuánto tienes hoy?", monthly: "¿Cuánto añades al mes?", growth: "¿Cuánto crece al año?", years: "¿Durante cuántos años?", see: "Ver mi resultado", edit: "Editar", done: "Listo", more: "50 € más al mes", sp500: /^S&P 500,/, world: /^Mundo,/, result: "Resultado" },
} as const;
type Lang = keyof typeof WORDS;

let server: Server;
let base = "";
let browser: Browser;

before(async () => {
  assert.ok(existsSync(join(OUT, "index.html")), "build first: npm run build");
  server = createServer((request, response) => {
    let file = join(OUT, decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname));
    if (existsSync(`${file.replace(/\/$/, "")}.html`)) file = `${file.replace(/\/$/, "")}.html`;
    else if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return void response.writeHead(404).end();
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  base = `http://localhost:${typeof address === "object" && address ? address.port : 0}`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function open(lang: Lang, width: number, height = 800): Promise<Page> {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + WORDS[lang].path, { waitUntil: "networkidle" });
  return page;
}

/** Types the two amounts and presses "See my result". */
async function firstResult(page: Page, lang: Lang): Promise<void> {
  const t = WORDS[lang];
  await page.getByLabel(t.have, { exact: true }).fill("20000");
  await page.getByLabel(t.monthly, { exact: true }).fill("400");
  await page.getByRole("button", { name: t.see }).click();
  await page.locator(`section[aria-label="${t.result}"]`).waitFor();
  await page.waitForLoadState("networkidle");
}

const bigNumber = (page: Page) => page.locator("#result-total").innerText();

describe("the first screen", () => {
  it("is one column in the middle of the page: headline, card, More options and what to trust, all as wide as the card", async () => {
    for (const lang of ["en", "es"] as const) {
      for (const width of [360, 1366, 1920]) {
        const page = await open(lang, width);
        const edges = await page.evaluate(() => {
          const box = (element: Element | null) => element?.getBoundingClientRect();
          const card = box(document.querySelector("main section[aria-label]"));
          const column = box(document.querySelector("main h1")?.parentElement?.parentElement ?? null);
          const headline = box(document.querySelector("main h1")?.parentElement ?? null);
          const trust = box(document.querySelector('[data-layout="start"] > ul'));
          const more = box(document.querySelector('[data-layout="start"] button[aria-expanded]'));
          return { card, column, headline, trust, more, page: document.querySelector("main")?.getBoundingClientRect() };
        });
        const { card, column, headline, trust, more, page: main } = edges;
        assert.ok(card && column && headline && trust && more && main);
        for (const [name, part] of [["headline", headline], ["column", column]] as const) {
          assert.ok(Math.abs(part.left - card.left) < 1 && Math.abs(part.right - card.right) < 1, `${name} as wide as the card (${lang} ${width})`);
        }
        assert.ok(Math.abs(trust.left - card.left) < 1 && trust.right <= card.right + 1, `what to trust inside the column (${lang} ${width})`);
        assert.ok(more.left >= card.left - 9 && more.right <= card.right, `More options inside the column (${lang} ${width})`);
        // Centred: as much room on the left as on the right.
        assert.ok(Math.abs(card.left - main.left - (main.right - card.right)) < 2, `centred (${lang} ${width})`);
        await page.close();
      }
    }
  });
});

describe("the four steps", () => {
  it("keep the same size in English and Spanish at 360, 1366 and 1920 px, nothing overflowing", async () => {
    for (const width of [360, 1366, 1920]) {
      const boxes = [];
      for (const lang of ["en", "es"] as const) {
        const page = await open(lang, width);
        const card = page.locator("main section[aria-label]").first();
        boxes.push(await card.boundingBox());
        const overflowing = await card.evaluate((element) =>
          [...element.querySelectorAll("label, p, span:not(.sr-only)")].filter((node) => node.scrollWidth > node.clientWidth + 1).map((node) => node.textContent),
        );
        assert.deepEqual(overflowing, [], `${lang} at ${width}`);
        await page.close();
      }
      assert.deepEqual(boxes[0], boxes[1], `card at ${width} px`);
    }
  });

  it("show step 3's line on what the number is, then the line before inflation, with no empty line before the examples", async () => {
    for (const lang of ["en", "es"] as const) {
      for (const width of [360, 1366, 1920]) {
        const page = await open(lang, width);
        const { slot, text, gap } = await page.evaluate(() => {
          const about = document.querySelector('[id$="-about"]') as HTMLElement;
          const range = document.createRange();
          range.selectNodeContents(about);
          const before = about.nextElementSibling as HTMLElement;
          return { slot: about.clientHeight, text: range.getBoundingClientRect().height, gap: before.getBoundingClientRect().top - about.getBoundingClientRect().bottom };
        });
        // The glyphs of two 20 px lines measure about 36 px; an empty line would leave about 18.
        assert.ok(slot - text < 8, `the line fills its place (${lang} ${width}: ${text} of ${slot})`);
        assert.ok(gap < 8, `the line before inflation right under it (${lang} ${width})`);
        await page.close();
      }
    }
  });

  it("start step 3 at 5 %, and its examples fill the field and are marked when they match", async () => {
    const page = await open("en", 360);
    const growth = page.getByLabel(WORDS.en.growth, { exact: true });
    assert.equal(await growth.inputValue(), "5");
    await page.getByRole("button", { name: WORDS.en.sp500 }).click();
    assert.equal(await growth.inputValue(), "7.5");
    assert.equal(await page.getByRole("button", { name: WORDS.en.sp500 }).getAttribute("aria-pressed"), "true");
    // Another number is one's own: nothing marked. An example's number marks it.
    await growth.fill("6");
    await growth.press("Enter");
    assert.equal(await page.locator('button[aria-pressed="true"]').count(), 0);
    await growth.fill("4.5");
    await growth.press("Enter");
    assert.equal(await page.getByRole("button", { name: WORDS.en.world }).getAttribute("aria-pressed"), "true");
    await page.close();
  });

  it("go on to the next field with Enter, and from the last to the button", async () => {
    const page = await open("es", 360);
    const t = WORDS.es;
    await page.getByLabel(t.have, { exact: true }).fill("1000");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement?.id), await page.getByLabel(t.monthly, { exact: true }).getAttribute("id"));
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement?.id), await page.getByLabel(t.years, { exact: true }).getAttribute("id"));
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), t.see);
    await page.close();
  });
});

describe("“See my result”", () => {
  it("is used only for the first result: after it, every change shows at once", async () => {
    const page = await open("en", 1366);
    await firstResult(page, "en");
    assert.equal(await page.getByRole("button", { name: WORDS.en.see }).count(), 0);
    const before = await bigNumber(page);
    await page.getByRole("button", { name: WORDS.en.more }).click();
    await page.waitForFunction((old) => document.getElementById("result-total")?.innerText !== old, before);
    // Emptied and typed again: back without a press.
    const monthly = page.getByLabel(WORDS.en.monthly, { exact: true });
    await monthly.fill("");
    await monthly.blur();
    await monthly.fill("300");
    await monthly.press("Enter");
    await page.locator("#result-total").waitFor();
    assert.equal(await page.getByRole("button", { name: WORDS.en.see }).count(), 0);
    await page.close();
  });
});

describe("the result, by the width of the window", () => {
  const columns = (page: Page) =>
    page.evaluate(() =>
      [...(document.querySelector('[data-layout="results"]')?.children ?? [])]
        .map((element) => element.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0)
        .map((box) => ({ left: Math.round(box.left), width: Math.round(box.width) })),
    );

  it("has three columns from 1440 px: What if…? narrow, the result the widest (640 px or more), the steps narrow", async () => {
    for (const width of [1440, 1920]) {
      const page = await open("es", width, 900);
      await firstResult(page, "es");
      const [left, middle, right] = await columns(page);
      assert.ok(left && middle && right, `three columns at ${width}`);
      assert.ok(left.left < middle.left && middle.left < right.left);
      assert.ok(middle.width >= 640 && middle.width > left.width && middle.width > right.width, JSON.stringify({ left, middle, right }));
      // Both side columns stay in sight while the page scrolls through the result.
      // Once every section is there (the table of countries loads last).
      await page.locator("tbody tr").first().waitFor();
      await page.waitForLoadState("networkidle");
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(300);
      for (const side of ["aside", '[style*="view-transition-name"]']) {
        const top = await page.locator(side).first().evaluate((element) => element.getBoundingClientRect().top);
        assert.ok(top >= 0 && top < 40, `${side} in sight at ${width}`);
      }
      await page.close();
    }
  });

  it("has two columns from 1024 to 1439 px: the result, then the steps with What if…? under them", async () => {
    for (const width of [1024, 1366]) {
      const page = await open("en", width, 768);
      await firstResult(page, "en");
      const visible = await columns(page);
      assert.equal(visible.length, 2, `two columns at ${width}`);
      assert.ok(visible[0].width > visible[1].width);
      const steps = page.locator('[style*="view-transition-name"]');
      assert.ok(await steps.getByRole("heading", { name: "What if…?" }).isVisible());
      await page.close();
    }
  });

  it("is one column on a phone, with the plan in a bar at the foot of the screen and What if…? under the chart", async () => {
    const page = await open("es", 360, 780);
    await firstResult(page, "es");
    assert.equal(await page.locator('[style*="view-transition-name"]').isVisible(), false);
    const bar = page.getByRole("button", { name: WORDS.es.edit });
    const box = await bar.boundingBox();
    assert.ok(box && box.y + box.height > 780 - 80, "the bar is at the foot of the screen");
    const chart = await page.locator('svg[role="img"]').boundingBox();
    const whatIf = await page.getByRole("heading", { name: "¿Y si…?" }).boundingBox();
    assert.ok(chart && whatIf && whatIf.y > chart.y);
    await page.close();
  });
});

describe("the compact steps beside the result and in the sheet", () => {
  it("fit their questions and fields in English and Spanish, nothing overflowing", async () => {
    for (const lang of ["en", "es"] as const) {
      for (const width of [360, 1024, 1366, 1440, 1920]) {
        const page = await open(lang, width, 800);
        await firstResult(page, lang);
        if (width < 1024) await page.getByRole("button", { name: WORDS[lang].edit }).click();
        const card = page.locator(`[style*="view-transition-name"] section[aria-label]`).first();
        await card.waitFor();
        const overflowing = await card.evaluate((element) => {
          const edge = element.getBoundingClientRect().right;
          return [...element.querySelectorAll("label, p, span:not(.sr-only), input, button")]
            .filter((node) => node.scrollWidth > node.clientWidth + 1 || node.getBoundingClientRect().right > edge + 0.5)
            .map((node) => node.textContent || node.getAttribute("aria-label"));
        });
        assert.deepEqual(overflowing, [], `${lang} at ${width}`);
        await page.close();
      }
    }
  });
});

describe("the bottom sheet on a phone", () => {
  it("opens the steps over at most half the screen, the big number in sight above, changing as they do", async () => {
    for (const lang of ["en", "es"] as const) {
      const page = await open(lang, 360, 780);
      await firstResult(page, lang);
      await page.mouse.wheel(0, 1200);
      await page.getByRole("button", { name: WORDS[lang].edit }).click();
      const sheet = page.getByRole("dialog");
      await sheet.waitFor();
      const box = await sheet.boundingBox();
      assert.ok(box && box.height <= 780 / 2 + 1 && box.y + box.height >= 779, JSON.stringify(box));
      await page.waitForTimeout(600);
      const total = await page.locator("#result-total").boundingBox();
      assert.ok(total && total.y >= 0 && total.y + total.height <= box.y, `the big number above the sheet (${lang})`);
      const before = await bigNumber(page);
      await sheet.getByRole("button", { name: WORDS[lang].more }).click();
      await page.waitForFunction((old) => document.getElementById("result-total")?.innerText !== old, before);
      await sheet.getByRole("button", { name: WORDS[lang].done }).click();
      assert.equal(await page.getByRole("dialog").count(), 0);
      await page.close();
    }
  });
});

describe("for a finger", () => {
  it("makes every button, link, field and tab at least 44 × 44 px, before and after the result, and fields 16 px", async () => {
    const page = await open("es", 360, 780);
    const small = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('a[href], button, input, select, summary, [role="radio"]')]
          .filter((element) => {
            const box = element.getBoundingClientRect();
            // A file input is hidden behind its own button.
            return box.width > 1 && box.height > 1 && (box.width < 44 || box.height < 44);
          })
          .map((element) => (element.getAttribute("aria-label") ?? element.textContent ?? "").trim()),
      );
    assert.deepEqual(await small(), []);
    await firstResult(page, "es");
    for (let i = 0; i < 2; i++) await page.getByRole("button", { name: /^Ver más/ }).first().click();
    await page.getByRole("button", { name: /^Te pagaría al mes/ }).click();
    assert.deepEqual(await small(), []);
    await page.getByRole("button", { name: WORDS.es.edit }).click();
    assert.deepEqual(await small(), []);
    const fields = await page.evaluate(() => [...document.querySelectorAll("input:not([type=file]):not([type=search])")].filter((input) => input.getBoundingClientRect().width > 0).map((input) => parseFloat(getComputedStyle(input).fontSize)));
    assert.ok(fields.length >= 4 && fields.every((size) => size >= 16), String(fields));
    await page.close();
  });
});
