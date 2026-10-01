import type { NextConfig } from "next";
// Where seed-lab's one site is published: the same file for the hub, Wealth
// Lens and the deploy workflow (docs/hosting.md).
import site from "../../deploy/site.json" with { type: "json" };

const nextConfig: NextConfig = {
  // A static site: no server routes, no functions. `next build` writes plain
  // HTML/CSS/JS to out/, served as-is.
  output: "export",
  // Wealth Lens lives in a folder of the site ("/wealth-lens"); the seed-lab
  // hub is at its root. Pages, links and the /_next/ files all take it.
  basePath: site.wealthLensPath,
  // Every page is a folder with its index.html (out/stocks/index.html), so
  // any static host serves /wealth-lens/stocks/ without rewrite rules.
  trailingSlash: true,
  // Written into the code at build time: src/lib/site.ts.
  env: { SITE_ORIGIN: site.origin, BASE_PATH: site.wealthLensPath },
};

export default nextConfig;
