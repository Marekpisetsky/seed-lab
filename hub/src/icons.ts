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
  // Code brackets: open source.
  open: '<path d="M8.5 7.5L4 12l4.5 4.5"/><path d="M15.5 7.5L20 12l-4.5 4.5"/><path d="M13.5 5.5l-3 13"/>',
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

/** The seed in the header, in the text's accent colour. */
export const SEED = raw(
  '<svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M16 28V16"/><path d="M16 17c0-5 3.5-8.5 9-8.5 0 5.5-3.5 8.5-9 8.5z"/><path d="M16 21c0-4-3-7-7.5-7 0 4 3 7 7.5 7z"/></svg>',
);

/** The site icon: a seed with its first shoot, in the accent colour. */
export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>path{fill:none;stroke:#8a3b12;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}@media (prefers-color-scheme:dark){path{stroke:#f0a36b}}</style><path d="M16 28V16"/><path d="M16 17c0-5 3.5-8.5 9-8.5 0 5.5-3.5 8.5-9 8.5z"/><path d="M16 21c0-4-3-7-7.5-7 0 4 3 7 7.5 7z"/></svg>`;
