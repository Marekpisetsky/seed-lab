/**
 * Where seed-lab lives and how to reach it: one place for every app.
 */

/** The seed-lab hub, where every tool links back to (provisional, on Vercel: docs/hosting.md). */
export const HUB_URL = "https://seed-lab-hub.vercel.app";

/**
 * How to reach seed-lab: the email address in two parts, joined only in
 * the browser, so the pages' HTML never holds it whole, nor a mail link,
 * and simple address harvesters do not find it.
 */
export const CONTACT = { user: "seedlab.eu", domain: "proton.me" } as const;
