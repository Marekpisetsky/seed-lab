/**
 * Where seed-lab lives and how to reach it: one place for every app.
 */

/** The seed-lab hub, where every tool links back to (provisional, on Vercel: docs/hosting.md). */
export const HUB_URL = "https://seed-lab-hub.vercel.app";

/**
 * seed-lab Research, public: the sheet behind each method and its sources
 * (research/README.md). An app links a sheet as `${RESEARCH_URL}/<path>`.
 */
export const RESEARCH_URL = "https://github.com/Marekpisetsky/seed-lab/blob/master/research";

/**
 * How to reach seed-lab: the email address in two parts, joined only in
 * the browser, so the pages' HTML never holds it whole, nor a mail link,
 * and simple address harvesters do not find it.
 */
export const CONTACT = { user: "seedlab.eu", domain: "proton.me" } as const;
