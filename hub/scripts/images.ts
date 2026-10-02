/**
 * Draws the raster brand images from their SVG sources, once, when the
 * mark changes (the build only copies them):
 *
 *   hub/static/apple-touch-icon.png       180 × 180, the seed on near-black
 *   hub/static/og.png                     1200 × 630, the picture a shared link shows
 *   wealth-lens/src/app/apple-icon.png    180 × 180, its icon on near-black
 *   wealth-lens/src/app/favicon.ico       16, 32 and 48 px
 *
 * Draws with Playwright's Chromium (a dev dependency): `npm run images`
 * installs that browser first if it is missing, then runs this script.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { BRAND, INK, SEED_MARK, TOUCH_ICON } from "../../packages/seed-kit/src/icons.ts";
import { messages } from "../src/i18n/index.ts";

const root = new URL("../../", import.meta.url);
const at = (path: string) => new URL(path, root);
const WEALTH_LENS_ICON = readFileSync(at("projects/wealth-lens/src/app/icon.svg"), "utf8");
const inner = (svg: string) => svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>"));
const onInk = (svg: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${INK}"/><g transform="translate(4.8 4.6) scale(.7)">${inner(svg)}</g></svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();

async function png(html: string, width: number, height: number, transparent = false): Promise<Buffer> {
  await page.setViewportSize({ width, height });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:${transparent ? "transparent" : INK}">${html}</body></html>`);
  return page.screenshot({ omitBackground: transparent, clip: { x: 0, y: 0, width, height } });
}
const svgAt = (svg: string, size: number) => svg.replace("<svg ", `<svg width="${size}" height="${size}" style="display:block" `);

/** An .ico holding PNG images, the format every browser reads. */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(({ data }) => data)]);
}

writeFileSync(at("hub/static/apple-touch-icon.png"), await png(svgAt(TOUCH_ICON, 180), 180, 180));
writeFileSync(at("projects/wealth-lens/src/app/apple-icon.png"), await png(svgAt(onInk(WEALTH_LENS_ICON), 180), 180, 180));
const sizes = [16, 32, 48];
const favicons: { size: number; data: Buffer }[] = [];
for (const size of sizes) favicons.push({ size, data: await png(svgAt(WEALTH_LENS_ICON, size), size, size, true) });
writeFileSync(at("projects/wealth-lens/src/app/favicon.ico"), ico(favicons));

const en = messages("en");
const es = messages("es");
const og = `
<div style="box-sizing:border-box;width:1200px;height:630px;padding:76px 80px;display:flex;flex-direction:column;justify-content:space-between;background:${INK};color:#fafafa;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
  <div style="display:flex;align-items:center;gap:28px">
    <svg width="120" height="120" viewBox="0 0 32 32"><g fill="${BRAND}">${SEED_MARK}</g></svg>
    <div style="font-size:92px;font-weight:800;letter-spacing:-3px">seed-lab</div>
  </div>
  <div>
    <div style="font-size:58px;font-weight:800;letter-spacing:-1.5px;line-height:1.08;max-width:980px">${en.home.title}</div>
    <div style="font-size:36px;color:#a3a3a3;margin-top:18px">${es.home.title}</div>
  </div>
  <div style="display:flex;justify-content:space-between;gap:24px;font-size:28px;color:#a3a3a3;white-space:nowrap"><span>${en.og.footer}</span><span style="color:${BRAND};font-weight:700">${en.og.tool}</span></div>
</div>`;
writeFileSync(at("hub/static/og.png"), await png(og, 1200, 630));

await browser.close();
console.log("Wrote the touch icons, the Wealth Lens favicon and the hub's share image.");
