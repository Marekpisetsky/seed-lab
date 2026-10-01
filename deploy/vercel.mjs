/**
 * The 301 redirects from the old Vercel addresses to the same pages on the
 * new site, ready but not in use. Each old Vercel project serves one of
 * these folders once the move is live (docs/hosting.md, "Redirect the old
 * addresses"):
 *
 *   deploy/vercel/hub/vercel.json          seed-lab-hub.vercel.app/…   → https://<domain>/…
 *   deploy/vercel/wealth-lens/vercel.json  seed-lab-omega.vercel.app/… → https://<domain>/wealth-lens/…
 *
 * Written from deploy/site.json, so the domain stays in one place:
 *
 *   node deploy/vercel.mjs           writes both files
 *   node deploy/vercel.mjs --check   fails if they no longer match deploy/site.json
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readSite } from "./site.mjs";
import { LOCALES, localePath, PAGES } from "../projects/wealth-lens/src/i18n/locales.ts";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const FILES = { hub: "deploy/vercel/hub/vercel.json", wealthLens: "deploy/vercel/wealth-lens/vercel.json" };

/** 301, not Vercel's default 308 for "permanent": the code every crawler and tool reads as "moved for good". */
const moved = (source, destination) => ({ source, destination, statusCode: 301 });

/** Both files' contents, from the site's origin and Wealth Lens's folder. */
export function redirects({ origin, wealthLensPath }) {
  const newWealthLens = `${origin}${wealthLensPath}`;
  // Wealth Lens on Vercel had no trailing slashes ("/es/stocks"); on the new site every page ends in one.
  const pages = Object.values(PAGES).flatMap((path) => LOCALES.map((locale) => localePath(path, locale)));
  const wealthLens = {
    $schema: "https://openapi.vercel.sh/vercel.json",
    redirects: [
      ...pages.map((page) => moved(page, `${newWealthLens}${page === "/" ? "" : page}/`)),
      // Anything else (a file, an old address): the same path in Wealth Lens's folder.
      moved("/:path*", `${newWealthLens}/:path*`),
    ],
  };
  // The hub's addresses are the same on the new site, at its root.
  const hub = {
    $schema: "https://openapi.vercel.sh/vercel.json",
    redirects: [moved("/", `${origin}/`), moved("/:path*", `${origin}/:path*`)],
  };
  return { hub, wealthLens };
}

const text = (value) => `${JSON.stringify(value, null, 2)}\n`;

/** The files that differ from what deploy/site.json says they should be. */
export function outdated(site = readSite()) {
  const wanted = redirects(site);
  return Object.entries(FILES)
    .filter(([key, file]) => {
      try {
        return readFileSync(join(ROOT, file), "utf8") !== text(wanted[key]);
      } catch {
        return true;
      }
    })
    .map(([, file]) => file);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const stale = outdated();
    if (stale.length > 0) {
      console.error(`${stale.join(" and ")} do not match deploy/site.json. Run: node deploy/vercel.mjs`);
      process.exit(1);
    }
    console.log("The Vercel redirects match deploy/site.json.");
  } else {
    const wanted = redirects(readSite());
    for (const [key, file] of Object.entries(FILES)) {
      mkdirSync(dirname(join(ROOT, file)), { recursive: true });
      writeFileSync(join(ROOT, file), text(wanted[key]));
      console.log(`Wrote ${file}`);
    }
  }
}
