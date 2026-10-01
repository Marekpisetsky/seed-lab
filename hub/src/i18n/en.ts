/**
 * Every word of the hub in English. Short, plain sentences. The front
 * page only shows what exists; plans and gaps live on the Roadmap page,
 * and nothing presents a step we have not reached as if it existed.
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
    roadmap: "Roadmap",
    noTracking: "No cookies. No analytics. Nothing about you is stored.",
    weight: (kb: string, compressed: string) => `This page weighs ${kb} KB (${compressed} KB compressed), measured when it was built.`,
    copyright: "© 2026 seed-lab. Free to use.",
  },
  meta: {
    home: {
      title: "seed-lab: free, privacy-first tools for Europe",
      description: "Free, privacy-first digital tools that Europeans can use without giving up their data. First tool: Wealth Lens.",
    },
    principles: { title: "Principles · seed-lab", description: "Five commitments for every seed-lab product, the rules behind them, and how each product meets them." },
    about: { title: "About · seed-lab", description: "What seed-lab is, where it is going, what it is not, and who makes it." },
    roadmap: { title: "Roadmap · seed-lab", description: "The steps seed-lab plans to climb, and what is still missing today." },
  },
  og: { footer: "Free to use. Your data never leaves your device.", tool: "First tool: Wealth Lens" },
  home: {
    title: "Free, privacy-first digital tools for Europe.",
    mission: "seed-lab builds free, privacy-first digital tools that Europeans — citizens, developers and public bodies — can use without giving up their data.",
    cta: "Try Wealth Lens",
    principlesTitle: "Five principles",
    principlesIntro: "Every seed-lab product keeps them. Each one comes with rules anyone can check.",
    principlesLink: "What they mean in practice",
    productKicker: "Our first tool",
    open: (name: string) => `Open ${name}`,
    languages: "Languages",
  },
  principles: {
    title: "Principles",
    lead: "Five commitments for every seed-lab product. Each one comes with rules anyone can check.",
    rulesLabel: "In practice",
    tableTitle: "How each product meets them",
    tableIntro: "Checked against the rules above. What is still missing is on the [roadmap](/roadmap/).",
    product: "Product",
    status: { meets: "Meets", progress: "In progress", partly: "Partly", pending: "Pending" },
    items: [
      {
        id: "device",
        title: "Your data never leaves your device.",
        short: "Your data stays on your device",
        text: "What you type is worked out on your device. We never see it.",
        rules: [
          "No app sends personal data to a server. Everything is worked out on your device.",
          "No accounts, no cookies, no analytics, no tracking.",
          "Nothing you type is stored. To keep your work, you save a file yourself.",
          "While you use a page, it asks no other service for anything.",
        ],
      },
      {
        id: "transparent",
        title: "Transparent.",
        short: "Transparent",
        text: "Free to use for everyone. Our methods and data sources are public. Our code is ours.",
        rules: [
          "Every product is free to use: no account, no ads, no payment.",
          "Every method is explained in plain words on a public page.",
          "Every figure says where it comes from, with its date.",
          "Changes to a method are listed in public.",
        ],
      },
      {
        id: "europe",
        title: "Truly European.",
        short: "Truly European",
        text: "Hosted in Europe, in Europe's languages, and built for the GDPR and the European Accessibility Act from the start.",
        rules: [
          "Every product is hosted in the EU.",
          "Everything is in at least English and Spanish, with numbers written each language's way.",
          "No personal data is processed, so the GDPR asks nothing of you.",
          "Every page meets WCAG 2.2 AA, checked by tools and by people, with a public accessibility statement.",
        ],
      },
      {
        id: "light",
        title: "Light.",
        short: "Light",
        text: "Small static pages: less energy, less cost, fast on any connection.",
        rules: [
          "Static pages, with no server of our own.",
          "Every page weighs under 350 KB on a first visit, compressed. That limit is published here.",
          "Every page scores 95 or more in Lighthouse's phone test.",
        ],
      },
      {
        id: "everyone",
        title: "For everyone.",
        short: "For everyone",
        text: "Clear enough for a child and their grandparent.",
        rules: [
          "Short sentences and no jargon. A test checks every text, in every language.",
          "Everything works with a keyboard and a screen reader. Buttons and links are at least 44 pixels tall.",
          "Automatic accessibility checks pass in light and dark mode.",
          "Products are tested with real people, children and older people included.",
        ],
      },
    ],
  },
  roadmap: {
    title: "Roadmap",
    lead: "Where seed-lab is going, step by step, and what is still missing today.",
    ladderTitle: "The steps",
    ladderIntro: "Each step only starts when the one before meets its condition.",
    here: "We are here",
    notYet: "Not yet",
    next: "Next step when",
    steps: [
      { what: "Tools people use. Today: Wealth Lens.", until: "people keep using them, month after month." },
      { what: "Free tools for developers that others adopt.", until: "others build on them without being asked." },
      { what: "A platform others depend on: European hosting, data and identity.", until: "" },
      { what: "Infrastructure at continental scale.", until: "" },
    ],
    missingTitle: "Still missing",
    missingIntro: "The gaps behind each Partly and Pending on the [principles](/principles/) page.",
    missing: [
      "Move every product to a host in the EU: under way, to statichost.eu in Sweden. Until then they run on Vercel, in the US.",
      "Find a European home for the code. Today it is kept on GitHub, in the US.",
      "More of the EU's 24 official languages. Today: English and Spanish.",
      "A WCAG audit by people, and a public accessibility statement.",
      "Tests with real people, children and older people included.",
      "A public list of changes to each method.",
      "Replace the sources that do not allow sharing their data, like Yahoo Finance, Numbeo and MSCI.",
    ],
    blocksTitle: "Free tools for developers",
    blocksIntro: "Wealth Lens is made of pieces other tools could reuse. We plan to publish them one by one. None is published yet.",
    planned: "Planned",
  },
  about: {
    title: "About",
    lead: "What seed-lab is, where it is going, and what it is not.",
    sections: [
      {
        heading: "What seed-lab is",
        body: [
          "seed-lab builds free, privacy-first digital tools for Europe.",
          "We publish free tools. Citizens, developers and institutions adopt them on their own.",
          "[Wealth Lens](wealth-lens) is the first tool, and the proof of our [principles](/principles/).",
        ],
      },
      {
        heading: "Where it is going",
        body: [
          "In the long run: give Europe its own technology stack, so its citizens, companies and governments don't have to depend on anyone else's.",
          "That is a direction, not something that exists. **Today we are at the first step: tools people use.** The [roadmap](/roadmap/) shows the steps after it.",
        ],
      },
      {
        heading: "What we are not",
        body: [
          "We do not sell to governments or do consulting. Anyone, institutions included, can use what we publish for free.",
          "We do not collect data. No accounts, no cookies, no analytics.",
          "We are not an EU institution. We do not speak for it or use its symbols.",
        ],
      },
      {
        heading: "Who makes it",
        body: [
          "It is made by Marek Pisetsky. The tools are free to use. Their code belongs to seed-lab.",
          "Questions or ideas? Write to [email](email).",
        ],
      },
      {
        heading: "This site",
        body: [
          "No cookies, no analytics, no tracking. It is plain HTML and CSS, plus two tiny scripts: one picks your language, one makes the email address a link.",
          "For now it is hosted on Vercel, in the US, like Wealth Lens. Both are moving to statichost.eu, in Sweden.",
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
