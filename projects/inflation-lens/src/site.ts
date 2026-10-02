/**
 * Who this tool is and where it lives. One place, so moving it (another
 * address, a folder of a bigger site) touches nothing else.
 */

/** Its id in seed-kit's tool list (packages/seed-kit/src/tools.json). */
export const ID = "inflation-lens";
export const NAME = "Inflation Lens";

/** Where it is published, without a trailing slash (provisional until it has its own address). */
export const SITE_URL = "https://seed-lab-inflation-lens.vercel.app";

/** The folder it lives in on that site ("/inflation-lens"), or "" at the root. */
export const BASE_PATH = "";

/** Most a page may weigh on a first visit, compressed: its HTML with the styles inside, its scripts and the icon. */
export const LIMIT_KB = 50;
