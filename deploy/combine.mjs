/**
 * Puts seed-lab's two builds together as one static site and checks it:
 *
 *   <out>/statichost.yml    tells statichost.eu to publish public/ as is, with no build
 *   <out>/README.md         says where the branch comes from
 *   <out>/public/           the hub (hub/dist) at the root,
 *   <out>/public/wealth-lens/  Wealth Lens (projects/wealth-lens/out) in its folder
 *
 * The folder comes from deploy/site.json, the same file both apps read.
 * The deploy workflow (.github/workflows/deploy.yml) runs it after both
 * builds and publishes <out> as the "deploy" branch.
 *
 *   node deploy/combine.mjs [out]      (default: _site)
 *
 * It stops, writing nothing it would publish, if a build is missing, if
 * the two would overwrite each other, or if a page links to a file the
 * site does not have.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { readSite } from "./site.mjs";
import { redirects } from "./vercel.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

export { readSite };

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

/** The file a same-site address is served from: "/a/" → a/index.html, "/a/b.js?x" → a/b.js. */
function served(site, href) {
  const path = decodeURIComponent(href.split(/[?#]/)[0]);
  const file = join(site, ...path.split("/").filter(Boolean));
  return path.endsWith("/") ? join(file, "index.html") : file;
}

/**
 * Every problem in a combined site: links and sources in its pages that
 * point to a missing file, sitemaps (from robots.txt) or sitemap entries
 * that do not exist, and addresses of the old hosts. Empty when it is fine.
 */
export function problems(site, { origin }) {
  const found = [];
  const exists = (href) => existsSync(served(site, href)) && statSync(served(site, href)).isFile();
  for (const file of files(site).filter((path) => path.endsWith(".html"))) {
    const name = relative(site, file).split(sep).join("/");
    const text = readFileSync(file, "utf8");
    for (const [, href] of text.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
      if (href.startsWith("//")) continue;
      if (!exists(href)) found.push(`${name} links to ${href}, which the site does not have`);
    }
    for (const [, url] of text.matchAll(/(?:rel="canonical"|hrefLang="[^"]+"|hreflang="[^"]+"|property="og:(?:url|image)") (?:href|content)="([^"]+)"/g)) {
      if (!url.startsWith(`${origin}/`)) found.push(`${name} names ${url}, outside ${origin}`);
      else if (!exists(url.slice(origin.length))) found.push(`${name} names ${url}, which the site does not have`);
    }
    if (/vercel\.app/.test(text)) found.push(`${name} still names a vercel.app address`);
  }
  const robots = join(site, "robots.txt");
  if (!existsSync(robots)) found.push("robots.txt is missing");
  else {
    for (const [, url] of readFileSync(robots, "utf8").matchAll(/^Sitemap: (\S+)$/gm)) {
      if (!url.startsWith(`${origin}/`) || !exists(url.slice(origin.length))) {
        found.push(`robots.txt lists ${url}, which the site does not have`);
        continue;
      }
      for (const [, loc] of readFileSync(served(site, url.slice(origin.length)), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
        if (!loc.startsWith(`${origin}/`) || !exists(loc.slice(origin.length))) found.push(`${url} lists ${loc}, which the site does not have`);
      }
    }
  }
  return found;
}

/** Writes the branch's contents to `out` from the two builds, and returns the problems found (none: ready to publish). */
export function combine({ hub, wealthLens, out, site }) {
  for (const [name, dir, page] of [
    ["the hub", hub, "index.html"],
    ["Wealth Lens", wealthLens, "index.html"],
  ]) {
    if (!existsSync(join(dir, page))) throw new Error(`${name} is not built: ${join(dir, page)} is missing`);
  }
  const folder = site.wealthLensPath.slice(1);
  if (existsSync(join(hub, folder.split("/")[0]))) throw new Error(`the hub's build already has ${folder.split("/")[0]}/, where Wealth Lens goes`);
  rmSync(out, { recursive: true, force: true });
  const publicDir = join(out, "public");
  mkdirSync(dirname(join(publicDir, folder)), { recursive: true });
  cpSync(hub, publicDir, { recursive: true });
  cpSync(wealthLens, join(publicDir, folder), { recursive: true });
  // No image: statichost.eu runs no build and publishes public/ as it is.
  writeFileSync(join(out, "statichost.yml"), "# Written by deploy/combine.mjs. No image, so no build: public/ is published as it is.\npublic: public\n");
  writeFileSync(
    join(out, "README.md"),
    "# seed-lab: the published site\n\nThis branch is written by `.github/workflows/deploy.yml` on every change to `master`. Do not edit it: any change here is replaced by the next run.\n\n- `public/`: the site. The hub at the root, Wealth Lens in `public" +
      site.wealthLensPath +
      "/`.\n- `statichost.yml`: tells statichost.eu to publish `public/` as it is, without building.\n\nHow it is set up: `docs/hosting.md` on `master`.\n",
  );
  return problems(publicDir, site);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ?? join(ROOT, "_site");
  const site = readSite();
  const found = combine({ hub: join(ROOT, "hub", "dist"), wealthLens: join(ROOT, "projects", "wealth-lens", "out"), out, site });
  // Every page the old Vercel addresses will send people to (deploy/vercel.mjs) has to exist here.
  for (const { source, destination } of Object.values(redirects(site)).flatMap((config) => config.redirects)) {
    if (destination.includes(":path")) continue;
    const path = destination.slice(site.origin.length);
    if (!existsSync(join(out, "public", ...path.split("/").filter(Boolean), "index.html"))) found.push(`the old address ${source} would be sent to ${destination}, which the site does not have`);
  }
  if (found.length > 0) {
    console.error(`The combined site has ${found.length} problem(s):\n- ${found.join("\n- ")}`);
    process.exit(1);
  }
  const all = files(join(out, "public"));
  console.log(`Combined site in ${out}: ${all.length} files, ${all.filter((file) => file.endsWith(".html")).length} pages. Every link and every redirect target checked.`);
}
