import { gzipSync } from "node:zlib";
import { layout } from "./layout.ts";
import type { PageInput, Weight } from "./layout.ts";

/** What a browser downloads for a page: its HTML, styles inside, and the icon. */
export function measure(files: readonly string[]): Weight {
  return files.reduce<Weight>(
    (total, file) => ({
      bytes: total.bytes + Buffer.byteLength(file),
      compressed: total.compressed + gzipSync(file, { level: 9 }).length,
    }),
    { bytes: 0, compressed: 0 },
  );
}

/**
 * A page that states its own weight: writing the number changes the
 * weight, so render, measure, and render again until what the footer
 * says is what the page weighs. It settles in two or three rounds.
 */
export function renderWithWeight(page: PageInput, extras: readonly string[]): { html: string; weight: Weight } {
  let weight: Weight = { bytes: 0, compressed: 0 };
  let html = layout(page, weight);
  for (let round = 0; round < 10; round += 1) {
    weight = measure([html, ...extras]);
    const next = layout(page, weight);
    if (next === html) return { html, weight };
    html = next;
  }
  throw new Error(`weight: the page ${page.id ?? "404"} (${page.locale}) did not settle`);
}
