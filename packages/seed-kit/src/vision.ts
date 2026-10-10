/**
 * Colour checks for the browser tests of every Horalis app: what a page
 * looks like to people with the common colour blindnesses (the browser's
 * own emulation, read back from a screenshot), how far apart two colours
 * are for the eye (CIEDE2000), and the WCAG contrast of every piece of
 * text on a page. The page is a Playwright page, passed in: the kit itself
 * depends on nothing.
 */

import { inflateSync } from "node:zlib";

/** Red-green (the two most common, about 1 man in 12 between them) and blue-yellow. */
export const DEFICIENCIES = ["deuteranopia", "protanopia", "tritanopia"] as const;
export type Deficiency = (typeof DEFICIENCIES)[number];

export type Rgb = readonly [number, number, number];

/**
 * Two colours a chart or a zone tells apart stay at least this far apart
 * (CIEDE2000) for every kind of colour vision. About 10 is "clearly a
 * different colour" side by side; the words, signs and shapes next to
 * them carry the meaning anyway.
 */
export const APART = 10;

/** The parts of a Playwright page these checks use. */
export interface VisionPage {
  screenshot(options?: { clip?: { x: number; y: number; width: number; height: number }; animations?: "disabled" }): Promise<Buffer>;
  context(): { newCDPSession(page: never): Promise<{ send(method: "Emulation.setEmulatedVisionDeficiency", params: { type: Deficiency | "none" }): Promise<unknown> }> };
  evaluate<R, A>(fn: (arg: A) => R | Promise<R>, arg: A): Promise<R>;
}

/** The page as people with that colour vision see it ("none": back to normal). */
export async function emulateVision(page: VisionPage, type: Deficiency | "none"): Promise<void> {
  const session = await page.context().newCDPSession(page as never);
  await session.send("Emulation.setEmulatedVisionDeficiency", { type });
}

/** The pixels of a PNG screenshot (8 bits, RGB or RGBA, not interlaced: what Chromium writes). */
export function decodePng(png: Buffer): { width: number; height: number; at(x: number, y: number): Rgb } {
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const data: Buffer[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const body = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      if (body[8] !== 8 || body[12] !== 0 || (body[9] !== 2 && body[9] !== 6)) throw new Error("decodePng: only 8-bit RGB(A), not interlaced");
      channels = body[9] === 6 ? 4 : 3;
    } else if (type === "IDAT") data.push(body);
    else if (type === "IEND") break;
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  for (let row = 0; row < height; row += 1) {
    const filter = raw[row * (stride + 1)];
    const line = raw.subarray(row * (stride + 1) + 1, (row + 1) * (stride + 1));
    for (let i = 0; i < stride; i += 1) {
      const left = i >= channels ? pixels[row * stride + i - channels] : 0;
      const up = row > 0 ? pixels[(row - 1) * stride + i] : 0;
      const corner = row > 0 && i >= channels ? pixels[(row - 1) * stride + i - channels] : 0;
      const p = left + up - corner;
      const [pa, pb, pc] = [Math.abs(p - left), Math.abs(p - up), Math.abs(p - corner)];
      const predicted = [0, left, up, (left + up) >> 1, pa <= pb && pa <= pc ? left : pb <= pc ? up : corner][filter];
      pixels[row * stride + i] = (line[i] + predicted) & 0xff;
    }
  }
  return {
    width,
    height,
    at(x, y) {
      const start = Math.round(y) * stride + Math.round(x) * channels;
      return [pixels[start], pixels[start + 1], pixels[start + 2]];
    },
  };
}

/** The colours at those points of the page (CSS pixels from its top-left corner), as the screen shows them now. */
export async function colorsAt(page: VisionPage, points: readonly { x: number; y: number }[]): Promise<Rgb[]> {
  const image = decodePng(await page.screenshot({ animations: "disabled" }));
  return points.map(({ x, y }) => image.at(x, y));
}

/** "rgb(10, 20, 30)", "rgba(…)" or "#0a141e" → [10, 20, 30]. */
export function parseColor(css: string): Rgb {
  const hex = /^#([0-9a-f]{6})$/i.exec(css.trim());
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as unknown as Rgb;
  const parts = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(css);
  if (!parts) throw new Error(`parseColor: ${css}`);
  return [Number(parts[1]), Number(parts[2]), Number(parts[3])];
}

const linear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** WCAG 2 contrast ratio, from 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const luminance = ([r, g, bl]: Rgb) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(bl);
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

function lab([r, g, b]: Rgb): [number, number, number] {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  // sRGB → XYZ (D65), then CIELAB.
  const xyz = [
    (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047,
    0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb,
    (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883,
  ].map((t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116));
  return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
}

/** How different two colours look (CIEDE2000, Sharma et al. 2005): 0 the same, about 2 just noticeable, 10 or more clearly apart. */
export function deltaE2000(a: Rgb, b: Rgb): number {
  return deltaE2000Lab(lab(a), lab(b));
}

/** The same, from two CIELAB colours (L*, a*, b*). */
export function deltaE2000Lab([l1, a1, b1]: readonly [number, number, number], [l2, a2, b2]: readonly [number, number, number]): number {
  const rad = Math.PI / 180;
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const cBar7 = ((c1 + c2) / 2) ** 7;
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + 25 ** 7)));
  const [p1, p2] = [(1 + g) * a1, (1 + g) * a2];
  const [cp1, cp2] = [Math.hypot(p1, b1), Math.hypot(p2, b2)];
  const hue = (x: number, y: number) => (x === 0 && y === 0 ? 0 : (Math.atan2(y, x) / rad + 360) % 360);
  const [h1, h2] = [hue(p1, b1), hue(p2, b2)];
  const dL = l2 - l1;
  const dC = cp2 - cp1;
  let dh = 0;
  if (cp1 * cp2 !== 0) dh = h2 - h1 > 180 ? h2 - h1 - 360 : h2 - h1 < -180 ? h2 - h1 + 360 : h2 - h1;
  const dH = 2 * Math.sqrt(cp1 * cp2) * Math.sin((dh / 2) * rad);
  const lBar = (l1 + l2) / 2;
  const cBar = (cp1 + cp2) / 2;
  let hBar = h1 + h2;
  if (cp1 * cp2 !== 0) hBar = Math.abs(h1 - h2) > 180 ? (h1 + h2 + (h1 + h2 < 360 ? 360 : -360)) / 2 : (h1 + h2) / 2;
  const t = 1 - 0.17 * Math.cos((hBar - 30) * rad) + 0.24 * Math.cos(2 * hBar * rad) + 0.32 * Math.cos((3 * hBar + 6) * rad) - 0.2 * Math.cos((4 * hBar - 63) * rad);
  const sL = 1 + (0.015 * (lBar - 50) ** 2) / Math.sqrt(20 + (lBar - 50) ** 2);
  const sC = 1 + 0.045 * cBar;
  const sH = 1 + 0.015 * cBar * t;
  const cBar7p = cBar ** 7;
  const rT = -2 * Math.sqrt(cBar7p / (cBar7p + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hBar - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / sL) ** 2 + (dC / sC) ** 2 + (dH / sH) ** 2 + rT * (dC / sC) * (dH / sH));
}

export interface ContrastProblem {
  text: string;
  ratio: number;
  needed: number;
  color: string;
  background: string;
}

/**
 * Every piece of text in sight on the page whose contrast with what is
 * behind it is under WCAG AA: 4.5:1, or 3:1 for large text (24 px, or
 * 18.66 px bold). What is behind it is the nearest solid background up the
 * page, with any see-through tint above it; text over a picture or in a
 * faded part, and disabled controls, are left out (WCAG does not count
 * inactive controls).
 */
export async function contrastProblems(page: VisionPage): Promise<ContrastProblem[]> {
  return page.evaluate(() => {
    const parse = (css: string) => (/rgba?\(([^)]+)\)/.exec(css)?.[1] ?? "0,0,0,0").split(/[,\s/]+/).filter(Boolean).map(Number);
    const lin = (c: number) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
    const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const found: { text: string; ratio: number; needed: number; color: string; background: string }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!element || seen.has(element) || !node.textContent?.trim()) continue;
      seen.add(element);
      if (element.closest("svg, [aria-hidden='true'], .sr-only, :disabled, [aria-disabled='true']")) continue;
      const box = element.getBoundingClientRect();
      if (box.width < 1 || box.height < 1 || box.bottom < 0 || box.top > innerHeight) continue;
      const style = getComputedStyle(element);
      if (style.visibility !== "visible" || Number(style.opacity) === 0) continue;
      // What is behind: the nearest solid background, with every see-through tint above it laid on top.
      const tints: number[][] = [];
      let background: number[] | null = null;
      let skip = false;
      for (let at: Element | null = element; at; at = at.parentElement) {
        const own = getComputedStyle(at);
        if (Number(own.opacity) < 1 || own.backgroundImage !== "none") skip = true;
        const fill = parse(own.backgroundColor);
        if (fill.length < 4 || fill[3] === 1) {
          background = fill.slice(0, 3);
          break;
        }
        if (fill[3] > 0) tints.push(fill);
      }
      if (skip) continue;
      const over = (top: number[], under: number[]) => under.map((channel, i) => top[i] * (top[3] ?? 1) + channel * (1 - (top[3] ?? 1)));
      background = tints.reduceRight((under, tint) => over(tint, under), background ?? parse(getComputedStyle(document.documentElement).backgroundColor).slice(0, 3));
      const color = over(parse(style.color), background);
      const [high, low] = [lum(color), lum(background)].sort((a, b) => b - a);
      const ratio = (high + 0.05) / (low + 0.05);
      const size = parseFloat(style.fontSize);
      const needed = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5;
      if (ratio < needed - 0.01) found.push({ text: node.textContent.trim().slice(0, 60), ratio: Math.round(ratio * 100) / 100, needed, color: style.color, background: `rgb(${background.map(Math.round).join(", ")})` });
    }
    return found;
  }, null);
}
