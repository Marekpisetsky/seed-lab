/** Regenerate only Wealth Lens's touch icon and multi-size favicon from icon.svg. */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { INK } from "../../../packages/seed-kit/src/icons.ts";

const app = new URL("../src/app/", import.meta.url);
const svg = readFileSync(new URL("icon.svg", app), "utf8");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const png = async (size: number, touch = false) => {
    await page.setViewportSize({ width: size, height: size });
    const source = svg.replace('<svg ', `<svg width="${touch ? size * 0.7 : size}" height="${touch ? size * 0.7 : size}" `);
    await page.setContent(`<body style="margin:0;display:grid;place-items:center;height:100vh;${touch ? `background:${INK}` : ""}">${source}</body>`);
    if (await page.locator("parsererror").count()) throw new Error("Invalid SVG");
    return page.screenshot({ omitBackground: !touch });
  };
  writeFileSync(new URL("apple-icon.png", app), await png(180, true));
  const images = [];
  for (const size of [16, 32, 48]) images.push({ size, data: await png(size) });
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + 16 * index;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  writeFileSync(new URL("favicon.ico", app), Buffer.concat([header, ...images.map(({ data }) => data)]));
} finally {
  await browser.close();
}
