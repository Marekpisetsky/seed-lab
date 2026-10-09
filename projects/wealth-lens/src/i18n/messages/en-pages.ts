/**
 * The English words of the pages the server writes whole: About, How it
 * works, Privacy, Terms, the 404 page and the pages' titles and
 * descriptions. Apart from en.ts so they are only in the server's code:
 * the browser never needs them, and the first screen does not download
 * them (components/i18n-en.tsx gives the browser en.ts alone).
 *
 * Same rules as en.ts; es-pages.ts has the same shape.
 */

import type { HowItWorksFacts, ProseSection, SourceEntry } from "../page-types";
import { en } from "./en";

export const enPages = {
  meta: {
    money: { title: "What your money can do", description: "See what you could do with your money, and when. Free and private." },
    test: { title: "Test my plan", description: "Your plan through the market crises of history, from 1929 to 2022." },
    about: { title: "About", description: "What Horalis Growth is, who makes it, and why it is free." },
    howItWorks: { title: "How it works", description: "The method and every source, with links and dates." },
    privacy: { title: "Privacy", description: "Nothing you type is saved or sent. No cookies. What the hosting logs." },
    terms: { title: "Terms", description: "Not financial advice. No guarantee. Use it at your own risk." },
  },
  about: {
    title: en.site.footer.about,
    lead: "Horalis Growth shows what your money can do, in plain words.",
    sections: [
      {
        heading: "What it is",
        body: [
          "Type what you have and what you add each month. Horalis Growth shows how it could grow, and when you could take a trip, pay a home deposit or live without working.",
          "It also shows what it could pay you each month, and where in the world that is enough.",
          "You can also [test your plan](/test) against big crashes from the past.",
          "It is free. There is no sign-up, no ads and no tracking.",
        ],
      },
      {
        heading: "Part of Horalis",
        body: ["Horalis Growth is the first tool of [Horalis](hub): small, free tools for any country that keep your data on your device."],
      },
      {
        heading: "Who makes it",
        body: [
          "It is made by Marek Pisetsky. Horalis Growth is free to use. Its code belongs to Horalis.",
          "Questions, ideas or a mistake to report? Write to [email](email).",
        ],
      },
      {
        heading: "What it is not",
        body: [
          "It is not financial advice. It never tells you what to buy or sell. Read the [terms](/terms).",
          "Its figures come from the past and from public sources. See [how it works](/how-it-works).",
        ],
      },
    ] as ProseSection[],
  },
  howItWorks: {
    title: en.site.footer.howItWorks,
    lead: "What Horalis Growth does with your numbers, what it assumes, and where every figure comes from.",
    sections: (facts: HowItWorksFacts): ProseSection[] => [
      {
        heading: "Your money grows",
        body: [
          "You start with an amount and add some every month. Each year the money grows by a percentage, and that growth grows too.",
          "All amounts are in today's euros. Prices rise over time, so the growth shown is growth after rising prices.",
          "Each monthly amount goes in at the end of its month, and it rises with prices.",
        ],
      },
      {
        heading: "How much it grows",
        body: [
          "The calculator starts at 5% a year after rising prices. World stocks grew 5.2% a year from 1900 to 2024, according to the UBS Global Investment Returns Yearbook 2025.",
          "Type another number, or tap an example. An example uses its own past years. Any other number moves up and down like US stocks.",
          `Each choice grows at its average from past years. All use the same years, ${facts.period}, so none looks better for starting in a good decade.`,
          "Stocks go up and down. So Horalis Growth works out 1,000 possible futures, each shuffling past years.",
          "“If it goes badly” is where 1 in 10 of those futures end below. “If it goes well” is where 1 in 10 end above.",
          "“First 10 years like 2000–2009” replays that decade as it happened, then grows at the average. Bonds and gold did well then, so they take their worst ten years.",
          "A mix grows like its parts, by weight. A savings account earns its interest, minus rising prices. Your own numbers can replace any of these.",
          "Only kinds of assets with a long public history are shown: US stocks, German government bonds, gold and savings. Never a single company or fund.",
        ],
      },
      {
        heading: "What it can pay you",
        body: [
          "Each month you could take out part of your money: your money × 4% ÷ 12. The slider goes from 2% to 7%.",
          "“It lasted 30 years” says in how many of 100 possible futures that amount lasted 30 years.",
          "Prudent: in 90 or more. Risky: in 75 or more. Very risky: in fewer.",
        ],
      },
      {
        heading: "Your goals",
        body: [
          "Under the result, My goals: only the ones you add. Each says when your plan gets there.",
          "You give the price of what you want. The grey example only shows the kind of figure.",
          "Living in a country uses what an average person there lives on (see Countries). Living without working uses your own monthly costs, or a country's as a start.",
          "Nothing is taken from your money: each goal is worked out on its own.",
        ],
      },
      {
        heading: "Check your plan",
        id: "check",
        body: [
          "Under the result, up to three observations, only when they apply. Each has its euros. They say what is, never what to do.",
          "Few years: your plan's years, or a goal, under 5 years away, and money that goes up and down. It counts how many of the 1,000 possible futures end below what you put in by then. It shows from 1 in 10. [The method](research:wealth-lens/chequeo.md#horizonte-frente-a-riesgo).",
          "Savings for 10 years or more: what the account keeps in today's money, against what you put in. And against US stocks, with the same amounts: what it gives up, and their worst fall. That fall comes from yearly data: within a year it may have been deeper. [The method](research:wealth-lens/chequeo.md#ahorro-a-largo-plazo).",
        ],
      },
      {
        heading: "Countries",
        body: [
          `The table has ${facts.countries} countries: those the World Bank's official data can price. No figure is invented for the others.`,
          `Each cost is what an average person there lives on a month, housing included. It comes from the household survey mean (${facts.surveyFrom}–${facts.surveyTo}, each country its latest).`,
          `That mean is brought to ${facts.priceYear} prices with the World Bank's price levels.`,
          "It is a national average: cities differ a lot. Some countries measure spending, others income, and a mean is pulled up by those who have most.",
          "✓ and a year mean what your money pays each month covers it from that year on. Otherwise the table says when your plan gets there. [The method](research:wealth-lens/coste-de-vida.md).",
        ],
      },
      {
        heading: "Rising prices in each country",
        body: [
          "Each country has a yearly rise in prices for the long run: the goal its central bank publishes, checked in September 2026.",
          "Euro countries use the European Central Bank's 2%. Where there is no goal, it is about the 2015–2024 average.",
          `In ${facts.highInflation}, prices rose 10% a year or more in 2015–2024. Where a goal exists, the goal is still used.`,
        ],
      },
      {
        heading: "Test my plan",
        body: [
          "Your plan goes through past years in the order they happened, with no replay. Figures are for whole calendar years.",
          "Each crash starts the year before it. The fall is what the crash did to the money you had at the top.",
          "A fall that came back within one year does not show in yearly figures. Covid in 2020 is one of them.",
        ],
      },
      {
        heading: "What it does not do",
        body: [
          "It gives no advice and makes no forecast. It leaves out taxes and most fees.",
          "It downloads nothing while you use it: every figure is part of the page, with its source and year.",
          "It does not convert currencies: all amounts are in euros.",
        ],
      },
    ],
    sourcesTitle: "Sources",
    sourcesIntro: "Each source, what it gives, how far its data goes, and its terms.",
    source: { link: "Open the source", date: "Data", terms: "Terms" },
    sources: (facts: HowItWorksFacts): SourceEntry[] => [
      {
        name: "UBS Global Investment Returns Yearbook 2025 (Dimson, Marsh and Staunton), as reported by Cambridge Judge Business School",
        what: "World stocks' yearly growth after rising prices, 1900–2024: 5.2%",
        url: "https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/",
        date: "1900 to 2024",
        terms: "Only this one figure is used: the 5% the calculator starts with.",
      },
      {
        name: "Robert J. Shiller, Yale University",
        what: "US stocks (S&P Composite) yearly growth, and US prices until 2022",
        url: "http://www.econ.yale.edu/~shiller/data.htm",
        date: "to June 2023",
        terms: "Free to use with credit.",
      },
      {
        name: "OECD and Deutsche Bundesbank",
        what: "German 10-year government bond yields",
        url: "https://www.oecd.org/en/data/indicators/long-term-interest-rates.html",
        date: "to December 2024",
        terms: "OECD data: CC BY 4.0, free to use with credit.",
      },
      {
        name: "Destatis, the German statistics office",
        what: "German prices",
        url: "https://www.destatis.de/EN/Themes/Economy/Prices/Consumer-Price-Index/_node.html",
        date: "to December 2024",
        terms: "Data licence Germany, attribution 2.0: free to use with credit.",
      },
      {
        name: "US Bureau of Labor Statistics",
        what: "US prices for 2023 and 2024",
        url: "https://www.bls.gov/cpi/",
        date: "to December 2024",
        terms: "Public domain.",
      },
      {
        name: "World Bank, Commodity Price Data (the Pink Sheet)",
        what: "Gold price, December average of each year",
        url: "https://www.worldbank.org/en/research/commodity-markets",
        date: "to December 2024",
        terms: "CC BY 4.0: free to use with credit.",
      },
      {
        name: "World Bank, Poverty and Inequality Platform and World Development Indicators",
        what: "What an average person lives on (household surveys), price levels (ICP 2021) and each year's rise in prices",
        url: "https://data.worldbank.org/indicator/SI.SPR.PCAP",
        date: `surveys to ${facts.surveyTo}, prices ${facts.priceYear}`,
        terms: "CC BY 4.0: free to use with credit.",
      },
      {
        name: "Central banks",
        what: "Their targets for rising prices",
        url: "https://www.bis.org/cbanks.htm",
        date: "checked September 2026",
        terms: "Public information.",
      },
      {
        name: "Unicode CLDR",
        what: "Country names in each language",
        url: "https://cldr.unicode.org",
        date: "as built into Node.js",
        terms: "Unicode License: free to use with credit.",
      },
    ],
    licensesTitle: "Data licenses",
    licenses: [
      "Every source lets anyone reuse its data with credit: the World Bank, the OECD, Destatis, the US Bureau of Labor Statistics, Robert Shiller and Unicode.",
      "Horalis Growth always says where a figure comes from and of which year.",
      "The method and the sources are public. The code belongs to Horalis. The data keeps its owners' rights.",
    ],
  },
  privacy: {
    title: en.site.footer.privacy,
    updated: "Updated on 7 October 2026.",
    sections: [
      { heading: "In short", body: ["**Nothing you type is saved or sent.** No cookies. No tracking."] },
      {
        heading: "Your numbers",
        body: [
          "What you type stays on this page, in your browser's memory. Close or reload the tab and it is gone.",
          "Horalis Growth has no accounts, no database and no server of its own. Your numbers never leave your device.",
          "**Download my data** saves a file on your device. **Load my data** reads that file on your device. Nothing is uploaded.",
        ],
      },
      {
        heading: "Cookies and storage",
        body: [
          "Horalis Growth uses no cookies. That is why there is no cookie banner.",
          "It keeps one thing, only if you pick it: light or dark.",
          "That choice stays in this tab's session storage. Closing the tab deletes it.",
          "It is never sent. Choosing “Automatic” deletes it at once.",
          "The first time, the language comes from your browser's settings. Nothing is stored to remember it.",
          "An older version saved data in the browser. If Horalis Growth finds it, it offers to load it once, then deletes it.",
        ],
      },
      {
        heading: "Figures",
        body: ["Every figure is part of the page when it is built. Your visit downloads nothing from anyone else."],
      },
      {
        heading: "Hosting",
        body: [
          "The site is hosted by Vercel. To deliver the pages and keep them safe, Vercel's servers may record technical data about each visit.",
          "That can include your IP address, the page requested, the time and your browser. Horalis Growth does not see or use these records.",
          "See [Vercel's privacy policy](https://vercel.com/legal/privacy-policy).",
        ],
      },
      { heading: "Questions", body: ["Write to [email](email)."] },
    ] as ProseSection[],
  },
  terms: {
    title: en.site.footer.terms,
    updated: "Updated on 1 October 2026.",
    sections: [
      {
        heading: "Not financial advice",
        body: [
          "Horalis Growth shows what numbers do. It does not tell you what to buy, sell or do.",
          "It does not know your whole situation: your taxes, debts, family or plans. For a big decision, talk to a licensed adviser.",
        ],
      },
      {
        heading: "No guarantee",
        body: [
          "Every figure is an estimate. Growth comes from the past, and the past does not promise the future.",
          "Costs of living and prices are rough and can be out of date. Horalis Growth may contain mistakes.",
          "It is provided as is, with no warranty of any kind.",
        ],
      },
      {
        heading: "Your own risk",
        body: ["You decide what to do with your money, and you use Horalis Growth at your own risk. Its makers are not responsible for losses or decisions based on it."],
      },
      {
        heading: "Free to use",
        body: [
          "Anyone can use Horalis Growth for free, on its website.",
          "The code belongs to Horalis. Without written permission, it may not be copied, changed, shared or used to make other products.",
          "The names and logos of Horalis and its tools are trademarks. They may not be used without written permission.",
          "The data belongs to its sources, which keep their rights. [How it works](/how-it-works) lists them all.",
        ],
      },
      { heading: "Changes", body: ["These terms can change. The date at the top says when they last did."] },
    ] as ProseSection[],
  },
  notFound: {
    title: "This page does not exist",
    text: "Maybe the address has a typo, or the page has moved.",
    home: "Go to Horalis Growth",
  },
};

export type PageMessages = typeof enPages;
