/**
 * The words seed-kit itself writes, in English: the header and footer of
 * every Horalis page (chrome.ts) and the privacy and terms page of the
 * static tools (legal.ts). One file per language: adding a language takes
 * a file like this one, its entry in ../locales.ts and its index entry.
 */

import { HOSTING } from "../hosting.ts";
import type { LegalPage } from "../legal-types.ts";

export const chrome = {
  skip: "Skip to content",
  pages: "Pages",
  language: "Language",
  launcher: "Horalis tools",
  hub: "Horalis",
  hubNote: "All the Horalis tools",
  tools: "Tools",
  here: "You are here",
  more: "More",
  theme: "Theme",
  themes: { auto: "Automatic", light: "Light", dark: "Dark" },
  themeAuto: "Like your device",
  themeNote: "Kept only in this tab.",
  partOf: "Part of Horalis",
  copyright: "© 2026 Horalis. Free to use.",
  /** Shown on the pages of a language that waits for a native speaker's review (locales.ts). */
  reviewNote: "This translation is waiting for a native speaker's review.",
};

export const legal = (name: string): LegalPage => ({
  title: "Privacy and terms",
  description: `${name} keeps nothing you type and sends nothing. No cookies. What the hosting sees, and the terms.`,
  updated: "Updated on 3 October 2026.",
  sections: [
    { heading: "In short", body: ["**Nothing you type is saved or sent.** No cookies. No tracking."] },
    {
      heading: "Your numbers",
      body: [
        "What you type stays in this page, in your browser's memory. Close or reload the tab and it is gone.",
        `${name} has no accounts, no database and no server of its own. Your numbers never leave your device.`,
      ],
    },
    {
      heading: "Cookies and storage",
      body: [
        `${name} uses no cookies. That is why there is no cookie banner.`,
        "It keeps one thing, only if you pick it: light or dark.",
        "That choice stays in this tab's session storage. Closing the tab deletes it.",
        "It is never sent. Choosing “Automatic” deletes it at once.",
        "The first time, the language comes from your browser's settings. Nothing is stored to remember it.",
      ],
    },
    {
      heading: "Hosting",
      body: [
        `The site is hosted by ${HOSTING.name}. To deliver the pages and keep them safe, its servers may record technical data about each visit.`,
        `That can include your IP address, the page asked for, the time and your browser. ${name} does not see or use these records.`,
        `See [${HOSTING.name}'s privacy policy](${HOSTING.policy}).`,
      ],
    },
    {
      heading: "No guarantee",
      body: [
        "Every figure is an estimate from public sources. It can be rough, out of date or wrong.",
        `${name} does not know your whole situation. It does not tell you what to do.`,
        "It is offered as it is, with no warranty of any kind. You use it at your own risk.",
      ],
    },
    {
      heading: "Free to use",
      body: [
        `Anyone can use ${name} for free, on its website.`,
        "The code belongs to Horalis. Without written permission, it may not be copied, changed, shared or used to make other products.",
        "The data belongs to its sources, which keep their rights. Each one is named next to its figures.",
      ],
    },
    { heading: "Questions", body: [`${name} is part of [Horalis](hub). How to reach us is on [its About page](hub-about).`] },
  ],
});
