/**
 * Takes the screenshots the front page shows, from each tool's real build:
 * Wealth Lens's big picture in the first band, and a picture for each
 * shown tool's card, in English and in Spanish. Each one is served from
 * its own build folder on this machine (projects/<id>/out or dist), typed
 * into like a person would, captured with Playwright's Chromium at twice
 * the size, and saved as WebP at a few widths (the browser's own encoder,
 * so no new dependency):
 *
 *   hub/static/shots/<id>-<hero|card>-<locale>-<width>.webp
 *   hub/content/shots.json   what was taken, its size and when
 *
 * Build the tools first (`npm run build` in each one), then `npm run shots`.
 * The hub's build only reads shots.json and copies the files.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";
import { localePath, SHOWN_LOCALES, type Locale } from "../../packages/seed-kit/src/locales.ts";
import { SHOWN_TOOLS } from "../../packages/seed-kit/src/tools.ts";
import { SHOT_KINDS, type Shots } from "../src/shots.ts";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const OUT = fileURLToPath(new URL("../static/shots/", import.meta.url));
const MANIFEST = fileURLToPath(new URL("../content/shots.json", import.meta.url));

/** The tool in the first band's picture. */
const HERO = "wealth-lens";

/** What to type so a tool shows a result, not empty questions; tools that open with an example need nothing. */
const SCENES: Readonly<Record<string, (page: Page) => Promise<void>>> = {
  "wealth-lens": async (page) => {
    const inputs = page.locator("main input");
    await inputs.nth(0).fill("10000");
    await inputs.nth(1).fill("300");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    // "See my result" (the one button that can be on or off): the page glides to the result.
    await page.locator('main button[aria-disabled="false"]').click();
    await page.waitForTimeout(1500);
  },
};

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

/** A tool's build folder served like its host would: "/es/" is es/index.html (or es.html, as Next writes it). */
function serve(dir: string): Promise<{ server: Server; base: string }> {
  const server = createServer((request, response) => {
    let file = join(dir, decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname));
    if (existsSync(`${file.replace(/\/$/, "")}.html`)) file = `${file.replace(/\/$/, "")}.html`;
    else if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  });
  return new Promise((resolve) =>
    server.listen(0, () => {
      const address = server.address();
      resolve({ server, base: `http://localhost:${typeof address === "object" && address ? address.port : 0}` });
    }),
  );
}

function buildFolder(id: string): string {
  for (const folder of ["out", "dist"]) {
    const dir = join(ROOT, "projects", id, folder);
    if (existsSync(join(dir, "index.html"))) return dir;
  }
  throw new Error(`shots: build ${id} first (projects/${id}: npm run build), there is no out/ or dist/ to photograph`);
}

const browser = await chromium.launch();
/** Encodes a PNG as WebP at a width, in the browser (canvas). */
const encoder = await browser.newPage();
async function webp(png: Buffer, width: number): Promise<Buffer> {
  const url = await encoder.evaluate(
    async ({ data, width }) => {
      const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const height = Math.round((bitmap.height * width) / bitmap.width);
      const scaled = await createImageBitmap(blob, { resizeWidth: width, resizeHeight: height, resizeQuality: "high" });
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(scaled, 0, 0);
      return canvas.toDataURL("image/webp", 0.8);
    },
    { data: png.toString("base64"), width },
  );
  return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const manifest: Shots = { takenOn: new Date().toISOString().slice(0, 10), tools: {} };
const wanted = [...new Set([HERO, ...SHOWN_TOOLS.map((tool) => tool.id)])];

for (const id of wanted) {
  const { server, base } = await serve(buildFolder(id));
  const kinds = SHOT_KINDS.filter((kind) => kind.name === "card" || id === HERO);
  for (const kind of kinds) {
    for (const locale of SHOWN_LOCALES as readonly Locale[]) {
      const page = await browser.newPage({ viewport: kind.viewport, deviceScaleFactor: 2, locale: locale === "es" ? "es-ES" : "en-GB", colorScheme: "light" });
      // Next writes /es as es.html, the static tools /es/ as a folder: both are served.
      await page.goto(base + localePath("/", locale), { waitUntil: "networkidle" });
      await SCENES[id]?.(page);
      const png = await page.screenshot();
      await page.close();
      for (const width of kind.widths) writeFileSync(join(OUT, `${id}-${kind.name}-${locale}-${width}.webp`), await webp(png, width));
    }
    manifest.tools[id] = { ...manifest.tools[id], [kind.name]: { width: kind.viewport.width, height: kind.viewport.height, widths: kind.widths } };
  }
  server.close();
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
await browser.close();
console.log(`Took the screenshots of ${wanted.join(", ")} into hub/static/shots/.`);
