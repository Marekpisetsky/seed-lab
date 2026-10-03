import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deflateSync } from "node:zlib";
import { contrastRatio, decodePng, deltaE2000, deltaE2000Lab, parseColor } from "../src/vision.ts";

/** A PNG of `rows` (RGB, 8 bits), each row with its own filter, as an encoder may write it. */
function png(rows: number[][][], filters: number[]): Buffer {
  const width = rows[0].length;
  const raw: number[] = [];
  const flat = rows.map((row) => row.flat());
  flat.forEach((line, y) => {
    const filter = filters[y];
    raw.push(filter);
    line.forEach((value, i) => {
      const left = i >= 3 ? line[i - 3] : 0;
      const up = y > 0 ? flat[y - 1][i] : 0;
      const corner = y > 0 && i >= 3 ? flat[y - 1][i - 3] : 0;
      const p = left + up - corner;
      const [pa, pb, pc] = [Math.abs(p - left), Math.abs(p - up), Math.abs(p - corner)];
      const predicted = [0, left, up, (left + up) >> 1, pa <= pb && pa <= pc ? left : pb <= pc ? up : corner][filter];
      raw.push((value - predicted + 256) & 0xff);
    });
  });
  const chunk = (type: string, body: Buffer) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(body.length);
    head.write(type, 4, "ascii");
    return Buffer.concat([head, body, Buffer.alloc(4)]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(rows.length, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.from(raw))), chunk("IEND", Buffer.alloc(0))]);
}

describe("the colour checks", () => {
  it("measure colour differences as CIEDE2000 does (Sharma, Wu and Dalal's test pairs)", () => {
    const pairs: [number[], number[], number][] = [
      [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
      [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
      [[50, 0, 0], [50, -1, 2], 2.3669],
      [[50, 2.5, 0], [73, 25, -18], 27.1492],
      [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
      [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
    ];
    for (const [a, b, expected] of pairs) assert.ok(Math.abs(deltaE2000Lab(a as [number, number, number], b as [number, number, number]) - expected) < 1e-4, `${a} ${b}`);
    assert.equal(deltaE2000([0, 163, 108], [0, 163, 108]), 0);
    assert.ok(deltaE2000([255, 255, 255], [0, 0, 0]) > 99);
  });

  it("measure WCAG contrast, and read the colours a browser writes", () => {
    assert.equal(Math.round(contrastRatio([255, 255, 255], [0, 0, 0])), 21);
    assert.equal(contrastRatio([82, 82, 82], [82, 82, 82]), 1);
    assert.deepEqual(parseColor("rgb(10, 20, 30)"), [10, 20, 30]);
    assert.deepEqual(parseColor("rgba(10, 20, 30, 0.5)"), [10, 20, 30]);
    assert.deepEqual(parseColor("#00a36c"), [0, 163, 108]);
  });

  it("read back the pixels of a screenshot, whatever filter each row uses", () => {
    const rows = [
      [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
      [[10, 20, 30], [200, 100, 50], [5, 6, 7]],
      [[11, 22, 33], [44, 55, 66], [77, 88, 99]],
      [[0, 0, 0], [255, 255, 255], [128, 64, 32]],
      [[1, 2, 3], [250, 251, 252], [100, 150, 200]],
    ];
    const image = decodePng(png(rows, [0, 1, 2, 3, 4]));
    assert.equal(image.width, 3);
    assert.equal(image.height, 5);
    rows.forEach((row, y) => row.forEach((pixel, x) => assert.deepEqual(image.at(x, y), pixel, `${x},${y}`)));
  });
});
