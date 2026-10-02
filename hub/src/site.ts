/**
 * Where things live. One place, so another session can change an address
 * without touching the pages. The addresses every app shares (the hub's,
 * the contact) live in seed-kit.
 */

import { HUB_URL } from "../../packages/seed-kit/src/site.ts";

/** The hub itself (provisional, on Vercel until it moves to a European host: docs/hosting.md). */
export const SITE_URL = HUB_URL;
