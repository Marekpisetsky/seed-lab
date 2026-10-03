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
      // Right under seed-lab's header, which stays in sight too.
      const header = await page.locator(".sk-header").evaluate((element) => element.getBoundingClientRect().bottom);
      for (const side of ["aside", "[data-steps]"]) {
        const top = await page.locator(side).first().evaluate((element) => element.getBoundingClientRect().top);
        assert.ok(top >= header && top < header + 40, `${side} in sight at ${width}: ${top} under ${header}`);
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
      const steps = page.locator('[data-steps]');
      assert.ok(await steps.getByRole("heading", { name: "What if…?" }).isVisible());
      await page.close();
    }
  });

  it("is one column on a phone, with the plan in a bar at the foot of the screen and What if…? under the chart", async () => {
    const page = await open("es", 360, 780);
    await firstResult(page, "es");
    assert.equal(await page.locator('[data-steps]').isVisible(), false);
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
        const card = page.locator(`[data-steps] section[aria-label]`).first();
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
    // Fields one types in (a slider has no text to zoom in on).
    const fields = await page.evaluate(() => [...document.querySelectorAll("input:not([type=file]):not([type=search]):not([type=range])")].filter((input) => input.getBoundingClientRect().width > 0).map((input) => parseFloat(getComputedStyle(input).fontSize)));
    assert.ok(fields.length >= 4 && fields.every((size) => size >= 16), String(fields));
    await page.close();
  });
});

/** A page with motion allowed, recording every layout shift from the start. */
async function withShifts(lang: Lang, width: number, height = 900): Promise<Page> {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(() => {
    const shifts: { value: number; recent: boolean }[] = [];
    (window as unknown as { shifts: typeof shifts }).shifts = shifts;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) shifts.push({ value: entry.value, recent: entry.hadRecentInput });
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(base + WORDS[lang].path, { waitUntil: "networkidle" });
  return page;
}

/** Cumulative layout shift as the browser counts it: shifts not right after an input. */
const cls = (page: Page) => page.evaluate(() => (window as unknown as { shifts: { value: number; recent: boolean }[] }).shifts.filter((shift) => !shift.recent).reduce((sum, shift) => sum + shift.value, 0));

describe("the way to the first result", () => {
  it("glides and shrinks the card into the column beside the result (FLIP), then the result comes in by parts in 300-400 ms", async () => {
    for (const width of [1366, 1920]) {
      const page = await withShifts("en", width);
      const t = WORDS.en;
      await page.getByLabel(t.have, { exact: true }).fill("20000");
      await page.getByLabel(t.monthly, { exact: true }).fill("400");
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: t.see }).click();
      // Once React has drawn the change: the card's move and the result's parts, all under way together.
      await page.waitForFunction(
        () =>
          document.getAnimations().some((animation) => (animation.effect as KeyframeEffect).target instanceof HTMLElement && ((animation.effect as KeyframeEffect).target as HTMLElement).getAttribute("aria-label") === "Calculator") &&
          document.getAnimations().filter((animation) => (animation as CSSAnimation).animationName === "reveal").length >= 3,
        undefined,
        { timeout: 2000, polling: "raf" },
      );
      const running = await page.evaluate(() =>
        document.getAnimations().map((animation) => {
          const effect = animation.effect as KeyframeEffect;
          const target = effect.target as HTMLElement;
          const timing = effect.getTiming();
          return { tag: target.tagName, label: target.getAttribute("aria-label"), css: (animation as CSSAnimation).animationName ?? null, duration: Number(timing.duration), delay: Number(timing.delay), first: (effect.getKeyframes()[0]?.transform as string) ?? "" };
        }),
      );
      // The card: a box that starts at the card's old size and place (translate and scale), its content kept at its final size.
      const card = running.find((animation) => animation.tag === "SECTION" && animation.label === "Calculator" && !animation.css);
      assert.ok(card && /translate\(-?\d/.test(card.first) && /scale\((?!1, 1\))/.test(card.first), JSON.stringify(running));
      assert.ok(running.some((animation) => animation.tag === "OL" && /^scale\(/.test(animation.first)));
      assert.ok(card.duration >= 300 && card.duration <= 400);
      // Number, grid, chart: one after the other, all done within 400 ms.
      const parts = running.filter((animation) => animation.css === "reveal");
      assert.deepEqual([...new Set(parts.map((animation) => animation.delay))].sort((a, b) => a - b), [0, 60, 120]);
      assert.ok(parts.every((animation) => animation.delay + animation.duration <= 400));
      await page.waitForTimeout(600);
      assert.equal(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running" && animation.timeline === document.timeline).length), 0);
      // The steps' column scrolls again once the card is in place: its last "What if…?" can be reached.
      assert.equal(await page.locator("[data-steps]").evaluate((element) => getComputedStyle(element).overflowY), "auto");
      await page.getByRole("button", { name: /^First 10 years like 2000–2009/ }).filter({ visible: true }).click();
      await page.getByRole("button", { name: /What if: first 10 years like 2000–2009/ }).waitFor();
      await page.close();
    }
  });

  it("moves nothing for those who ask for less motion", async () => {
    const page = await open("en", 1366);
    const t = WORDS.en;
    await page.getByLabel(t.have, { exact: true }).fill("20000");
    await page.getByLabel(t.monthly, { exact: true }).fill("400");
    await page.getByRole("button", { name: t.see }).click();
    await page.locator("#result-total").waitFor();
    assert.equal(await page.evaluate(() => document.getAnimations().filter((animation) => animation.timeline === document.timeline).length), 0);
    await page.close();
  });

  it("shifts no layout (CLS 0) at 360, 1366 and 1920 px: the result, its sections and the page scrolled to the end", async () => {
    for (const lang of ["en", "es"] as const) {
      for (const width of [360, 1366, 1920]) {
        const page = await withShifts(lang, width, width < 1024 ? 780 : 900);
        const t = WORDS[lang];
        await page.getByLabel(t.have, { exact: true }).fill("20000");
        await page.getByLabel(t.monthly, { exact: true }).fill("400");
        await page.getByRole("button", { name: t.see }).click();
        await page.locator("tbody tr").first().waitFor();
        await page.waitForLoadState("networkidle");
        for (let step = 0; step < 12; step++) {
          await page.mouse.wheel(0, 400);
          await page.waitForTimeout(60);
        }
        await page.waitForTimeout(500);
        assert.equal(await cls(page), 0, `${lang} at ${width}`);
        await page.close();
      }
    }
  });
});

describe("seed-lab's header", () => {
  it("stays at the top while the page scrolls, compact: on a phone, the row of pages", async () => {
    for (const width of [360, 1366]) {
      const page = await open("en", width, 800);
      const full = await page.locator(".sk-header").evaluate((element) => element.getBoundingClientRect().height);
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(300);
      const box = await page.locator(".sk-header").evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, position: getComputedStyle(element).position };
      });
      assert.equal(box.position, "sticky");
      // In sight, and taking less of the screen than at the top of the page.
      assert.ok(box.bottom > 40 && box.bottom < full, `${width}: ${JSON.stringify(box)} of ${full}`);
      const pages = await page.getByRole("link", { name: "Test my plan" }).boundingBox();
      assert.ok(pages && pages.y >= 0 && pages.y + pages.height <= box.bottom, "the pages stay in reach");
      await page.close();
    }
  });
});

describe("Test my plan", () => {
  const TEST = {
    en: { path: "/test", headline: "What would the real crises have done to your plan?", financial: /^Financial crisis/, more: /^See more/, started: "If you had started in 2007" },
    es: { path: "/es/test", headline: "¿Qué le habría pasado a tu plan en las crisis reales?", financial: /^Crisis financiera/, more: /^Ver más/, started: "Si hubieras empezado en 2007" },
  } as const;

  it("puts its headline on one line from 1024 px, and each crisis in a big card with a small line and its figure in euros", async () => {
    for (const lang of ["en", "es"] as const) {
      for (const width of [360, 1366, 1920]) {
        const page = await open(lang, width, 900);
        // The plan typed in My money, then the page, as a person goes there.
        await page.getByLabel(WORDS[lang].have, { exact: true }).fill("1100");
        await page.getByLabel(WORDS[lang].monthly, { exact: true }).fill("100");
        await page.getByRole("link", { name: lang === "en" ? "Test my plan" : "Probar mi plan" }).first().click();
        await page.waitForURL(/test/);
        const headline = page.getByRole("heading", { level: 1 });
        assert.equal(await headline.innerText(), TEST[lang].headline);
        if (width >= 1024) {
          const lines = await headline.evaluate((element) => element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight));
          assert.ok(lines < 1.5, `${lang} at ${width}: ${lines} lines`);
        }
        const cards = page.locator('ul > li > button[aria-pressed]');
        assert.equal(await cards.count(), 6);
        const boxes = await cards.evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect()).map((box) => ({ width: box.width, height: box.height })));
        assert.ok(boxes.every((box) => box.width >= 44 && box.height >= 44));
        const figure = await page.getByRole("button", { name: TEST[lang].financial }).innerText();
        assert.match(figure, /€/);
        assert.doesNotMatch(figure, /%/);
        await page.close();
      }
    }
  });

  it("opens a crisis with what happened, its chart and its figure; the rest behind “See more”", async () => {
    for (const lang of ["en", "es"] as const) {
      const page = await open(lang, 360, 780);
      await page.getByLabel(WORDS[lang].have, { exact: true }).fill("1100");
      await page.getByLabel(WORDS[lang].monthly, { exact: true }).fill("100");
      await page.getByRole("link", { name: lang === "en" ? "Test my plan" : "Probar mi plan" }).first().click();
      await page.waitForURL(/test/);
      await page.getByRole("button", { name: TEST[lang].financial }).click();
      const panel = page.locator('section[aria-labelledby="crisis-title"]');
      await panel.waitFor();
      assert.ok(await panel.locator('svg[role="img"]').isVisible());
      assert.equal(await panel.getByText(TEST[lang].started).count(), 0);
      await panel.getByRole("button", { name: TEST[lang].more }).click();
      assert.ok(await panel.getByText(TEST[lang].started).isVisible());
      await page.close();
    }
  });
});
