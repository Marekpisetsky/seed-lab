import { raw } from "./html.ts";
import type { Html } from "./html.ts";

/**
 * Five plain line icons, one per principle, drawn on a 24 px grid in the
 * text colour. They only decorate: the words next to them say the same,
 * so screen readers skip them. No flags, stars or emblems.
 */

const PATHS = {
  // A phone: what stays on your device.
  device: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><path d="M9.5 10.5l2 2 3.5-4"/>',
  // An open eye: nothing hidden about how it works.
  transparent: '<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  // A globe with its lines: many places, many languages.
  europe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
  // A leaf: light, less energy.
  light: '<path d="M5 19c0-8 5-13.5 14-14 0 9-5.5 14-14 14z"/><path d="M5 19c3-4 6-6.5 9.5-8.5"/>',
  // A grown-up and a child: for everyone.
  everyone: '<circle cx="8.5" cy="6" r="2.5"/><path d="M4 21v-6.5a4.5 4.5 0 019 0V21"/><circle cx="17" cy="10" r="2"/><path d="M14 21v-3.5a3 3 0 016 0V21"/>',
} as const;

export type IconId = keyof typeof PATHS;

export function isIconId(id: string): id is IconId {
  return Object.hasOwn(PATHS, id);
}

export function icon(id: IconId, size = 28): Html {
  return raw(
    `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[id]}</svg>`,
  );
}

/**
 * The seed-lab mark: an oval seed with a sprout of two leaves, on a 32 px
 * grid, all filled shapes so it still reads at 16 px. Wealth Lens's icon
 * (projects/wealth-lens/src/app/icon.svg) is the same seed with a rising
 * line: one family.
 */
export const SEED_MARK =
  '<ellipse cx="16" cy="23.5" rx="10" ry="6.5"/><rect x="14.7" y="11" width="2.6" height="8" rx="1.3"/><path d="M15.6 13.2C15 8.6 11.4 5.6 6.2 5.8c.4 5 4.2 8 9.4 7.4z"/><path d="M16.4 11.6c.8-4.8 4.6-7.8 9.6-7.4-.6 5-4.6 7.8-9.6 7.4z"/>';

/** Seed green, the --brand of tokens.css (an icon file cannot read CSS variables; a test keeps it equal). */
export const BRAND = "#00a36c";
/** The near-black of the dark bands, behind the touch icon. */
export const INK = "#0a0a0a";

/** The mark in the header, in the band's brand colour. */
export const SEED = raw(`<svg width="26" height="26" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">${SEED_MARK}</svg>`);

/** The site icon: the seed in green, on nothing. */
export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="${BRAND}">${SEED_MARK}</g></svg>`;

/** The touch icon (apple-touch-icon.png, drawn by scripts/images.ts): the seed on near-black, full bleed. */
export const TOUCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${INK}"/><g fill="${BRAND}" transform="translate(4.8 4.6) scale(.7)">${SEED_MARK}</g></svg>`;
