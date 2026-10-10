/**
 * Horalis: its name, its line, where it lives and how to reach it, one
 * place for every app. "seed-lab" stays only as the repository's and the
 * folders' name; nothing a visitor sees says it.
 */

import type { Localized } from "./locales.ts";

/** The brand every page shows. */
export const BRAND_NAME = "Horalis";

/** The brand's line, after its name: "Horalis. Own your hours." */
export const MOTTO: Localized = { en: "Own your hours.", es: "Tus horas, tuyas." };

/** The Horalis hub, where every tool links back to (provisional, on Vercel: docs/hosting.md). */
export const HUB_URL = "https://seed-lab-hub.vercel.app";

/**
 * Horalis Research, public: the sheet behind each method and its sources
 * (research/README.md). An app links a sheet as `${RESEARCH_URL}/<path>`.
 */
export const RESEARCH_URL = "https://github.com/Marekpisetsky/seed-lab/blob/master/research";

/**
 * How to reach Horalis: the email address in two parts, joined only in
 * the browser, so the pages' HTML never holds it whole, nor a mail link,
 * and simple address harvesters do not find it.
 */
export const CONTACT = { user: "horalis", domain: "proton.me" } as const;
