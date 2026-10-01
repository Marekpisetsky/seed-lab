/**
 * Where things live. One place, so another session can change an address
 * without touching the pages.
 */

import site from "../../deploy/site.json" with { type: "json" };

/**
 * seed-lab's one site, "https://…" with no trailing slash: the hub at its
 * root, the tools in folders of it (Wealth Lens at /wealth-lens/). From
 * deploy/site.json, the same file Wealth Lens and the deploy read
 * (docs/hosting.md). Only for absolute addresses: canonical and language
 * links, the sharing card, robots.txt and the sitemap.
 */
export const SITE_URL: string = site.origin;
if (!/^https:\/\/[a-z0-9.-]+$/.test(SITE_URL)) throw new Error(`deploy/site.json: origin must be https://<domain>, got ${SITE_URL}`);

/** Wealth Lens's folder on the site, "/wealth-lens" (its next.config.ts basePath). */
export const WEALTH_LENS_PATH: string = site.wealthLensPath;

/**
 * How to reach seed-lab: the email address in two parts, joined only in
 * the browser (email.ts). The pages' HTML never holds it whole, nor a mail
 * link, so simple address harvesters do not find it.
 */
export const CONTACT = { user: "seedlab.eu", domain: "proton.me" } as const;
