import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSite } from "./site.mjs";
import { outdated, redirects } from "./vercel.mjs";

describe("the redirects from the old Vercel addresses (ready, not in use)", () => {
  const { hub, wealthLens } = redirects({ origin: "https://seed-lab.example", wealthLensPath: "/wealth-lens" });
  const target = (config, path) => {
    const rule = config.redirects.find((entry) => entry.source === path) ?? config.redirects.at(-1);
    return { status: rule.statusCode, to: rule.destination.replace(":path*", path.slice(1)) };
  };

  it("send each Wealth Lens page to the same page in its folder, with the trailing slash, as a 301", () => {
    assert.deepEqual(target(wealthLens, "/"), { status: 301, to: "https://seed-lab.example/wealth-lens/" });
    assert.deepEqual(target(wealthLens, "/es"), { status: 301, to: "https://seed-lab.example/wealth-lens/es/" });
    assert.deepEqual(target(wealthLens, "/es/stocks"), { status: 301, to: "https://seed-lab.example/wealth-lens/es/stocks/" });
    assert.deepEqual(target(wealthLens, "/data/prices.json"), { status: 301, to: "https://seed-lab.example/wealth-lens/data/prices.json" });
    assert.equal(wealthLens.redirects.length, 7 * 2 + 1, "every page in both languages, then everything else");
  });

  it("send every hub address to the same address at the root of the new site, as a 301", () => {
    assert.deepEqual(target(hub, "/"), { status: 301, to: "https://seed-lab.example/" });
    assert.deepEqual(target(hub, "/es/principles/"), { status: 301, to: "https://seed-lab.example/es/principles/" });
  });

  it("never use Vercel's permanent flag, which answers 308, not 301", () => {
    for (const rule of [...hub.redirects, ...wealthLens.redirects]) {
      assert.equal(rule.statusCode, 301);
      assert.equal("permanent" in rule, false);
    }
  });

  it("are written from deploy/site.json: run `node deploy/vercel.mjs` after changing the domain", () => {
    assert.deepEqual(outdated(readSite()), []);
  });
});
