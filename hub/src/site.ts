/**
 * Where things live. One place, so another session can change an address
 * without touching the pages.
 */

/** The hub itself (provisional, on Vercel until it moves to a European host: docs/hosting.md). */
export const SITE_URL = "https://seed-lab-hub.vercel.app";

/**
 * How to reach seed-lab: the email address in two parts, joined only in
 * the browser (email.ts). The pages' HTML never holds it whole, nor a mail
 * link, so simple address harvesters do not find it.
 */
export const CONTACT = { user: "seedlab.eu", domain: "proton.me" } as const;
