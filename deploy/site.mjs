/**
 * deploy/site.json, read and checked: the site's origin ("https://…", no
 * trailing slash) and Wealth Lens's folder ("/wealth-lens"). The hub,
 * Wealth Lens (next.config.ts) and these deploy scripts read the same file.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FILE = fileURLToPath(new URL("./site.json", import.meta.url));

export function readSite(file = FILE) {
  const site = JSON.parse(readFileSync(file, "utf8"));
  if (!/^https:\/\/[a-z0-9.-]+$/.test(site.origin ?? "")) throw new Error(`${file}: origin must be https://<domain>, with no trailing slash`);
  if (!/^(\/[a-z0-9-]+)+$/.test(site.wealthLensPath ?? "")) throw new Error(`${file}: wealthLensPath must look like /wealth-lens`);
  return site;
}
