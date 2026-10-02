import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { combine, readSite } from "./combine.mjs";

const SITE = { origin: "https://seed-lab.example", wealthLensPath: "/wealth-lens" };

function write(root, files) {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
}

const page = (body, canonical) => `<!doctype html><html><head>${canonical ? `<link rel="canonical" href="${canonical}">` : ""}</head><body>${body}</body></html>`;

/** Two tiny builds that link to each other, as the real ones do. */
function builds(change = {}) {
  const root = mkdtempSync(join(tmpdir(), "combine-"));
  const hub = join(root, "hub");
  const wealthLens = join(root, "wl");
  write(hub, {
    "index.html": page('<a href="/es/">ES</a><a href="/wealth-lens/">Wealth Lens</a>', "https://seed-lab.example/"),
    "es/index.html": page('<a href="/wealth-lens/es/">Wealth Lens</a>', "https://seed-lab.example/es/"),
    "404.html": page('<a href="/">Home</a>'),
    "robots.txt": "User-agent: *\nAllow: /\n\nSitemap: https://seed-lab.example/sitemap.xml\nSitemap: https://seed-lab.example/wealth-lens/sitemap.xml\n",
    "sitemap.xml": "<urlset><url><loc>https://seed-lab.example/</loc></url><url><loc>https://seed-lab.example/es/</loc></url></urlset>",
    ...change.hub,
  });
  write(wealthLens, {
    "index.html": page('<a href="/">seed-lab</a><script src="/wealth-lens/_next/static/a.js"></script>', "https://seed-lab.example/wealth-lens/"),
    "es/index.html": page('<a href="/es/">seed-lab</a>', "https://seed-lab.example/wealth-lens/es/"),
    "_next/static/a.js": "",
    "sitemap.xml": "<urlset><url><loc>https://seed-lab.example/wealth-lens/</loc></url><url><loc>https://seed-lab.example/wealth-lens/es/</loc></url></urlset>",
    ...change.wealthLens,
  });
  return { hub, wealthLens, out: join(root, "site"), site: SITE };
}

describe("the combined site", () => {
  it("puts the hub at the root and Wealth Lens in its folder, under public/, with a statichost.yml that builds nothing", () => {
    const input = builds();
    assert.deepEqual(combine(input), []);
    assert.match(readFileSync(join(input.out, "public", "index.html"), "utf8"), /href="\/wealth-lens\/"/);
    assert.match(readFileSync(join(input.out, "public", "wealth-lens", "index.html"), "utf8"), /href="\/"/);
    const config = readFileSync(join(input.out, "statichost.yml"), "utf8");
    assert.match(config, /^public: public$/m);
    assert.doesNotMatch(config, /^(image|command):/m);
  });

  it("finds a link to a page or a file the site does not have", () => {
    const input = builds({ wealthLens: { "index.html": page('<a href="/wealth-lens/stocks/">Stocks</a><script src="/_next/static/a.js"></script>') } });
    assert.deepEqual(combine(input), ["wealth-lens/index.html links to /wealth-lens/stocks/, which the site does not have", "wealth-lens/index.html links to /_next/static/a.js, which the site does not have"]);
  });

  it("finds canonical addresses outside the site, old vercel.app ones and sitemap entries that do not exist", () => {
    const input = builds({
      hub: { "es/index.html": page('<a href="https://seed-lab-hub.vercel.app/">old</a>', "https://seed-lab-hub.vercel.app/es/") },
      wealthLens: { "sitemap.xml": "<urlset><url><loc>https://seed-lab.example/wealth-lens/test/</loc></url></urlset>" },
    });
    assert.deepEqual(combine(input), [
      "es/index.html names https://seed-lab-hub.vercel.app/es/, outside https://seed-lab.example",
      "es/index.html still names a vercel.app address",
      "https://seed-lab.example/wealth-lens/sitemap.xml lists https://seed-lab.example/wealth-lens/test/, which the site does not have",
    ]);
  });

  it("refuses builds that are missing or would overwrite each other", () => {
    const input = builds({ hub: { "wealth-lens/index.html": page("") } });
    assert.throws(() => combine(input), /already has wealth-lens\//);
    assert.throws(() => combine({ ...builds(), wealthLens: join(input.out, "nothing") }), /Wealth Lens is not built/);
  });
});

describe("deploy/site.json", () => {
  it("holds an https origin with no trailing slash and Wealth Lens's folder", () => {
    const site = readSite();
    assert.match(site.origin, /^https:\/\/[a-z0-9.-]+$/);
    assert.equal(site.wealthLensPath, "/wealth-lens");
  });

  it("refuses an origin with a path or a slash, and a folder without its leading slash", () => {
    const root = mkdtempSync(join(tmpdir(), "site-"));
    const check = (value) => {
      writeFileSync(join(root, "site.json"), JSON.stringify(value));
      return () => readSite(join(root, "site.json"));
    };
    assert.throws(check({ origin: "https://seed-lab.example/", wealthLensPath: "/wealth-lens" }), /origin/);
    assert.throws(check({ origin: "http://seed-lab.example", wealthLensPath: "/wealth-lens" }), /origin/);
    assert.throws(check({ origin: "https://seed-lab.example", wealthLensPath: "wealth-lens" }), /wealthLensPath/);
  });
});
