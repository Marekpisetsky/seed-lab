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
    name: "Horalis",
    nav: { principles: "Principles", about: "About" },
    roadmap: "Roadmap",
    noTracking: "No cookies. No analytics. Nothing about you is stored.",
    weight: (kb: string, compressed: string) => `This page weighs ${kb} KB (${compressed} KB compressed), measured when it was built.`,
  },
  meta: {
    home: {
      title: "Horalis: free, private tools for any country",
      description: "Free, private digital tools that work in any country, built in Europe. Nothing you type leaves your device. First tool: Horalis Growth.",
    },
    principles: { title: "Principles · Horalis", description: "Five commitments for every Horalis product, the rules behind them, and how each product meets them." },
    about: { title: "About · Horalis", description: "What Horalis is, where it is going, what it is not, and who makes it." },
    roadmap: { title: "Roadmap · Horalis", description: "The steps Horalis plans to climb, and what is still missing today." },
  },
  og: { footer: "Free to use. Your data never leaves your device.", tool: "First tool: Horalis Growth" },
  home: {
    title: "Horalis. Own your hours.",
    mission: "Free, private digital tools that work in any country, built in Europe. Every calculation happens on your device.",
    cta: "Try Horalis Growth",
    heroAlt: "Horalis Growth: what €10,000 and €300 a month could become in 20 years, with a chart.",
    principlesKicker: "Principles",
    principlesTitle: "Five principles, each with a rule you can check",
    principlesIntro: "Every Horalis product is held to them. Each one comes with rules anyone can check, and what is still missing is public.",
    principlesLink: "What they mean in practice",
    toolsKicker: "Tools",
    toolsTitle: (count: number): string => (count === 1 ? "A tool for everyday life" : "Tools for everyday life"),
    toolsIntro: "Free, in your browser, and nothing is saved.",
    status: { live: "Live", beta: "Beta" },
    open: (name: string) => `Open ${name}`,
    cardAlt: (name: string) => `${name}, as it looks on a computer.`,
    languages: "Languages",
    buildKicker: "How we build",
    buildTitle: "A factory, its pieces and research",
    buildIntro: "We never start from zero. Each new tool stands on what the others already proved.",
    buildSteps: [
      { name: "Forja", title: "The factory", text: "It makes each new tool on the shared base, with tests that already pass." },
      { name: "seed-kit", title: "The pieces", text: "Colours, header and footer, languages, privacy and the checks every page passes." },
      { name: "Research", title: "The research", text: "It decides and tests every method. No method changes without its own card." },
    ],
    diagram: {
      label: "How a tool is built",
      base: "seed-kit",
      parts: ["colours", "header and footer", "languages", "privacy", "checks"],
      mould: "Forja makes it",
      next: "A new tool",
      hub: "This site",
      research: "decides and tests the methods",
    },
    buildClosing: "So every tool is private, light and in English and Spanish from day one. Each method has its card, with its sources and its limits.",
    differentKicker: "What makes us different",
    differentTitle: "What a typical app asks of you, and what we ask",
    differentIntro: "We name no one. These are common habits on the web.",
    typical: "A typical app",
    ours: "Horalis",
    rows: [
      { label: "An account", typical: "Often required", ours: "Never" },
      { label: "Tracking", typical: "Analytics and ad trackers", ours: "None" },
      { label: "Your data", typical: "Kept on their servers", ours: "Stays on your device" },
      { label: "Ads", typical: "Often", ours: "Never" },
    ],
    weightLabel: "Page weight",
    weightTypical: (kb: string) => `About ${kb} KB: the median web page on a phone`,
    weightOurs: (kb: string) => `${kb} KB at most on this site, measured when it was built`,
    weightSource: "The median comes from the [HTTP Archive Web Almanac 2024](https://almanac.httparchive.org/en/2024/page-weight).",
    figuresKicker: "In numbers",
    figuresTitle: "Measured when this site was built",
    figures: {
      cookies: "cookies",
      trackers: "trackers",
      weight: "KB at most per page",
      languages: "languages",
      countries: "countries in our data",
      tools: (count: number): string => (count === 1 ? "tool built on the platform" : "tools built on the platform"),
    },
  },
  principles: {
    title: "Principles",
    lead: "Five commitments for every Horalis product. Each one comes with rules anyone can check.",
    rulesLabel: "In practice",
    tableTitle: "How each product meets them",
    tableIntro: "Checked against the rules above. What is still missing is on the [roadmap](/roadmap/).",
    product: "Product",
    status: { meets: "Meets", partly: "Partly", pending: "Pending" },
    items: [
      {
        id: "device",
        /** The rule the front page shows, from `rules`: one that holds today. */
        homeRule: 0,
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
        /** The rule the front page shows, from `rules`: one that holds today. */
        homeRule: 0,
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
        /** The rule the front page shows, from `rules`: one that holds today. */
        homeRule: 1,
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
        /** The rule the front page shows, from `rules`: one that holds today. */
        homeRule: 1,
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
        /** The rule the front page shows, from `rules`: one that holds today. */
        homeRule: 0,
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
    lead: "Where Horalis is going, step by step, and what is still missing today.",
    ladderTitle: "The steps",
    ladderIntro: "Each step only starts when the one before meets its condition.",
    here: "We are here",
    notYet: "Not yet",
    next: "Next step when",
    steps: [
      { what: "Tools people use. Today: Horalis Growth.", until: "people keep using them, month after month." },
      { what: "Free tools for developers that others adopt.", until: "others build on them without being asked." },
      { what: "A platform others depend on: European hosting, data and identity.", until: "" },
      { what: "Infrastructure at continental scale.", until: "" },
    ],
    missingTitle: "Still missing",
    missingIntro: "The gaps behind each Partly and Pending on the [principles](/principles/) page.",
    missing: [
      "Move every product to a host in the EU. Today they run on Vercel, in the US.",
      "Find a European home for the code. Today it is kept on GitHub, in the US.",
      "More of the EU's 24 official languages. Today: English and Spanish.",
      "A WCAG audit by people, and a public accessibility statement.",
      "Tests with real people, children and older people included.",
      "A public list of changes to each method.",
    ],
    blocksTitle: "Free tools for developers",
    blocksIntro: "Horalis Growth is made of pieces other tools could reuse. We plan to publish them one by one. None is published yet.",
    planned: "Planned",
  },
  about: {
    title: "About",
    lead: "What Horalis is, where it is going, and what it is not.",
    sections: [
      {
        heading: "What Horalis is",
        body: [
          "Horalis builds free, private digital tools that work in any country. They are built in Europe.",
          "We publish free tools. Citizens, developers and institutions adopt them on their own.",
          "[Horalis Growth](wealth-lens) is the first tool, and the proof of our [principles](/principles/).",
        ],
      },
      {
        heading: "Where it is going",
        body: [
          "In the long run: information that is no longer centralised and tracked. Every calculation happens on your own device, and no tool needs a central server to work.",
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
          "It is made by Marek Pisetsky. The tools are free to use. Their code belongs to Horalis.",
          "Questions or ideas? Write to [email](email).",
        ],
      },
      {
        heading: "This site",
        body: [
          "No cookies, no analytics, no tracking. It is plain HTML and CSS, plus three tiny scripts.",
          "One picks your language. One keeps light or dark, only in this tab, until you close it. One makes the email address a link.",
          "For now it is hosted on Vercel, in the US, like Horalis Growth. A move to a European host is planned.",
        ],
      },
    ],
  },
  notFound: {
    title: "This page does not exist",
    text: "Maybe the address has a typo, or the page moved.",
    home: "Go to Horalis",
  },
};

export type Messages = typeof en;
