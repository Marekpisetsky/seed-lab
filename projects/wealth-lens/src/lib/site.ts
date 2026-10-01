/**
 * Where Wealth Lens is published and how to reach seed-lab. One place, so
 * another session can change it without touching components.
 */

function checked(value: string | undefined, pattern: RegExp, name: string): string {
  if (value === undefined || !pattern.test(value)) throw new Error(`${name} must match ${pattern}, from deploy/site.json; got ${JSON.stringify(value)}`);
  return value;
}

/**
 * seed-lab's one site, "https://…" with no trailing slash: the hub at its
 * root and Wealth Lens in a folder of it. Both come from deploy/site.json,
 * written into the code by next.config.ts (and by vitest.config.mts in
 * tests); the references stay literal so the build can replace them.
 */
export const SITE_ORIGIN = checked(process.env.SITE_ORIGIN, /^https:\/\/[a-z0-9.-]+$/, "SITE_ORIGIN");

/** Wealth Lens's folder on that site, "/wealth-lens" (next.config.ts basePath). */
export const BASE_PATH = checked(process.env.BASE_PATH, /^(\/[a-z0-9-]+)+$/, "BASE_PATH");

/** Wealth Lens's own address, with its trailing slash: sharing cards, canonical links, the sitemap. */
export const WEALTH_LENS_URL = `${SITE_ORIGIN}${BASE_PATH}/`;

/**
 * A file of public/ as the browser asks for it, inside Wealth Lens's
 * folder: "/data/lines/vwce.json" → "/wealth-lens/data/lines/vwce.json".
 * Next adds the folder to links and its own files, not to fetch().
 */
export function publicPath(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * A Wealth Lens page for a plain <a>, where Next's Link does not add the
 * folder and the trailing slash: "/" → "/wealth-lens/", "/es" →
 * "/wealth-lens/es/".
 */
export function pageHref(path: string): string {
  return `${BASE_PATH}${path === "/" ? "" : path}/`;
}

/** A Wealth Lens page's full address: "/es/stocks" → "https://…/wealth-lens/es/stocks/". */
export function pageUrl(path: string): string {
  return `${SITE_ORIGIN}${pageHref(path)}`;
}

/**
 * The email address is kept in two parts and only joined in the browser
 * (components/ui/email.tsx): the static HTML never holds it whole, nor a
 * mail link, so simple address harvesters do not find it.
 */
export const CONTACT = { user: "seedlab.eu", domain: "proton.me" } as const;
