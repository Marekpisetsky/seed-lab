import { languageScript } from "@seed-kit/detect.ts";
import { themeScript } from "@seed-kit/theme.ts";

/**
 * Runs in the <head> of every page, before anything is painted: seed-kit's
 * language script, the one every seed-lab app uses. It tells the document
 * which language the page is in (the /es/ pages share the root layout,
 * whose <html> is written once, in English), and on arriving from outside
 * the site at an English address it sends the browser to the same page in
 * the reader's language when the browser prefers one the app speaks.
 * Nothing is stored.
 */
export const LANGUAGE_SCRIPT = languageScript();

/**
 * seed-kit's theme script, first in the <head>: the light or dark mode
 * picked in the header for this tab, if any, before anything is painted
 * (theme.ts). The header's menu itself is React (seed-kit's chrome).
 */
export const THEME_SCRIPT = themeScript();
