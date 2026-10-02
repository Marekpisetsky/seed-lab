/**
 * seed-lab's icons as SVG text, for any app: the seed mark, the launcher's
 * grid, a check, and one plain line icon per principle. They only
 * decorate (aria-hidden): the words next to them say the same.
 */

/**
 * The seed-lab mark: an oval seed with a sprout of two leaves, on a 32 px
 * grid, all filled shapes so it still reads at 16 px. Each tool's icon is
 * the same seed carrying its own sign (Wealth Lens: a rising line).
 */
export const SEED_MARK =
  '<ellipse cx="16" cy="23.5" rx="10" ry="6.5"/><rect x="14.7" y="11" width="2.6" height="8" rx="1.3"/><path d="M15.6 13.2C15 8.6 11.4 5.6 6.2 5.8c.4 5 4.2 8 9.4 7.4z"/><path d="M16.4 11.6c.8-4.8 4.6-7.8 9.6-7.4-.6 5-4.6 7.8-9.6 7.4z"/>';

/** Seed green, the --brand of tokens.css (an icon file cannot read CSS variables; a test keeps it equal). */
export const BRAND = "#00a36c";
/** The near-black of the dark bands, behind the touch icons. */
export const INK = "#0a0a0a";

/** The mark in a header, in the text's colour. */
export function seedSvg(size = 26): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">${SEED_MARK}</svg>`;
}

/** The site icon: the seed in green, on nothing. */
export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="${BRAND}">${SEED_MARK}</g></svg>`;

/** The touch icon: the seed on near-black, full bleed (drawn to PNG by hub/scripts/images.ts). */
export const TOUCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${INK}"/><g fill="${BRAND}" transform="translate(4.8 4.6) scale(.7)">${SEED_MARK}</g></svg>`;

const line = (paths: string, size: number) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

/** Four squares: the tools launcher. */
export const GRID_ICON = line('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>', 20);

/** A tick: "you are here". */
export const CHECK_ICON = line('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 14);

/**
 * Five plain line icons, one per principle, drawn on a 24 px grid in the
 * text colour. No flags, stars or emblems.
 */
export const PRINCIPLE_ICONS = {
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

export type PrincipleIconId = keyof typeof PRINCIPLE_ICONS;

export function isPrincipleIconId(id: string): id is PrincipleIconId {
  return Object.hasOwn(PRINCIPLE_ICONS, id);
}

/** A principle's icon, in the text colour (stroke 1.6, as the hub draws them). */
export function principleIcon(id: PrincipleIconId, size = 28): string {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PRINCIPLE_ICONS[id]}</svg>`;
}
