/**
 * Every word of the hub in English. Short, plain sentences. Honest about
 * what exists: nothing here presents a coming block, or a step of the
 * ladder we have not reached, as if it existed.
 *
 * "**bold**" and "[words](address)" work in the longer texts; an address
 * starting with "/" is a page of the hub, in the page's language.
 */

export const en = {
  site: {
    name: "seed-lab",
    skip: "Skip to content",
    nav: { label: "Pages", principles: "Principles", about: "About" },
    language: "Language",
    footerNav: "More",
    github: "Code on GitHub",
    noTracking: "No cookies. No analytics. Nothing about you is stored.",
    weight: (kb: string, compressed: string) => `This page weighs ${kb} KB (${compressed} KB compressed), measured when it was built.`,
    license: "MIT license",
  },
  meta: {
    home: {
      title: "seed-lab: open, privacy-first tools for Europe",
      description: "Open, privacy-first digital tools that Europeans can use without giving up their data. First tool: Wealth Lens.",
    },
    principles: { title: "Principles · seed-lab", description: "Five principles, how Wealth Lens meets them today, and what is still missing." },
    about: { title: "About · seed-lab", description: "What seed-lab is, where it is going, what it is not, and who makes it." },
  },
  home: {
    kicker: "seed-lab",
    title: "Open, privacy-first digital tools for Europe.",
    mission: "seed-lab builds open, privacy-first digital tools that Europeans — citizens, developers and public bodies — can use without giving up their data.",
    principlesTitle: "Five principles",
    principlesLink: "How we meet them, and what is still missing",
    toolsTitle: "Tools",
    toolsIntro: "One tool so far. It is the proof that these principles work.",
    open: (name: string) => `Open ${name}`,
    source: "Source code",
    languages: "Languages",
    blocksTitle: "Building blocks",
    blocksIntro: [
      "Wealth Lens is made of pieces other tools could reuse. We will publish them as open building blocks, one by one.",
      "**None is published yet.** Today they live inside Wealth Lens, where you can already read their code.",
    ],
  },
  status: { live: "Live", coming: "Coming" },
  principles: {
    title: "Principles",
    lead: "Five principles, how Wealth Lens meets them today, and what is still missing.",
    today: "Wealth Lens today",
    missing: "Still missing",
    pending: "Pending",
    items: [
      {
        id: "device",
        title: "Your data never leaves your device.",
        short: "Your data stays on your device",
        text: "Everything is worked out on your device. No accounts, no cookies, no analytics, no server that keeps anything about you.",
        today: [
          "Every figure is calculated in your browser.",
          "Nothing is saved: close the tab and it is gone. To keep your plan, you download a file.",
          "Files you load are read on your device and never uploaded.",
          "Prices are downloaded once a day by the site itself, not by your browser.",
        ],
        missing: [
          { text: "Like any web host, the current host still sees each visit's technical data, such as the IP address.", pending: false },
        ],
      },
      {
        id: "open",
        title: "Open: open source, open data.",
        short: "Open source, open data",
        text: "The code is open for anyone to read and reuse. Data comes from open sources where possible, with its source and date.",
        today: [
          "All the code is public under the MIT license.",
          "Much of the data is open, like the World Bank's and the OECD's, and credited.",
          "From sources that forbid copying, it only keeps figures worked out from their data.",
        ],
        missing: [
          { text: "The code lives on GitHub, a US company. A European copy on Codeberg is planned.", pending: true },
          { text: "Some figures come from closed sources, like Yahoo Finance, Numbeo and MSCI. Open ones should replace them.", pending: true },
        ],
      },
      {
        id: "europe",
        title: "Truly European.",
        short: "Truly European",
        text: "Hosted in Europe, in Europe's languages, and built to respect the GDPR and the European Accessibility Act from the start.",
        today: [
          "English and Spanish, with numbers written each language's way.",
          "Automatic checks (axe and Lighthouse) find no accessibility errors.",
          "It keeps no personal data, so there is nothing to ask consent for.",
        ],
        missing: [
          { text: "It is hosted on Vercel, a US company. [Moving to a European host](hosting) is planned but not done yet.", pending: true },
          { text: "Two of the EU's 24 official languages. More are needed.", pending: true },
          { text: "No full WCAG audit by a person, and no accessibility statement yet.", pending: true },
        ],
      },
      {
        id: "light",
        title: "Light: small static pages.",
        short: "Light",
        text: "Small static pages use less energy, cost less and load fast on any connection.",
        today: [
          "Static pages, with no calls to other services while you use them.",
          "Each page scores 95 or more in Lighthouse's phone test.",
          "This hub has no JavaScript framework. Its weight is shown at the bottom of each page.",
        ],
        missing: [{ text: "Wealth Lens pages carry a JavaScript framework. They are heavier than this hub and should get lighter.", pending: true }],
      },
      {
        id: "everyone",
        title: "For everyone.",
        short: "For everyone",
        text: "Clear enough for a child and their grandparent: short sentences, no jargon, and it works with a keyboard or a screen reader.",
        today: [
          "A test keeps sentences short and free of jargon, in both languages.",
          "Harder words are explained in a short note you can open.",
          "Buttons and links are at least 44 pixels tall, easy to tap.",
        ],
        missing: [{ text: "No tests yet with real people: children and older people included.", pending: true }],
      },
    ],
  },
  about: {
    title: "About",
    lead: "What seed-lab is, where it is going, and what it is not.",
    sections: [
      {
        heading: "What seed-lab is",
        body: [
          "seed-lab builds open, privacy-first digital tools for Europe.",
          "We publish tools and open building blocks. Citizens, developers and institutions adopt them on their own.",
          "[Wealth Lens](wealth-lens) is the first tool, and the proof of our [principles](/principles/).",
        ],
      },
      {
        heading: "Where it is going",
        body: [
          "In the long run: give Europe its own technology stack, so its citizens, companies and governments don't have to depend on anyone else's.",
          "That is a direction, not something that exists. **Today we are at the first step: tools people use.** Open blocks, a platform and infrastructure would come later, and only if the step before works.",
        ],
      },
      {
        heading: "What we are not",
        body: [
          "We do not sell to governments or do consulting. Anyone, institutions included, can adopt what we publish on their own.",
          "We do not collect data. No accounts, no cookies, no analytics.",
          "We are not an EU institution. We do not speak for it or use its symbols.",
        ],
      },
      {
        heading: "Who makes it",
        body: [
          "It is made by [Marekpisetsky](author) on GitHub, in the open. The code is under the [MIT license](license).",
          "Questions or ideas? [Open an issue on GitHub](issues). There is no email, on purpose.",
          "The full direction, with the ladder of steps, is in [direction.md](direction).",
        ],
      },
      {
        heading: "This site",
        body: [
          "No cookies, no analytics, no tracking. It is plain HTML and CSS, plus one line of script that picks your language.",
          "For now it is hosted on Vercel, in the US, like Wealth Lens. We plan to move both to a European host.",
        ],
      },
    ],
  },
  notFound: {
    title: "This page does not exist",
    text: "Maybe the address has a typo, or the page moved.",
    home: "Go to seed-lab",
  },
};

export type Messages = typeof en;
