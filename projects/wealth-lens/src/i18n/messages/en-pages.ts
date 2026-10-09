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
    stocks: { title: "My stocks", description: "What you hold, what you gained, and each fund's years." },
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
          "You can also [test your plan](/test) against big crashes from the past, and see [how your stocks did](/stocks).",
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
          "Type another number, or tap an example. An example uses its own past years. Any other number moves up and down like world stocks.",
          `Each choice grows at its average from past years. All use the same years, ${facts.period}, so none looks better for starting in a good decade.`,
          "Stocks go up and down. So Horalis Growth works out 1,000 possible futures, each shuffling past years.",
          "“If it goes badly” is where 1 in 10 of those futures end below. “If it goes well” is where 1 in 10 end above.",
          "“First 10 years like 2000–2009” replays that decade as it happened, then grows at the average. Bonds and gold did well then, so they take their worst ten years.",
          "A mix grows like its parts, by weight. My portfolio weights each holding by its value, and each grows like its index.",
          "A savings account earns its interest, minus rising prices. Your own numbers can replace any of these.",
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
        heading: "What you could do with it",
        body: [
          "Under the big number, up to three wishes, each with when your plan gets there.",
          "First, the goals you marked as most important in My goals. Then examples to discover: a trip, a home and time.",
          "A home is its deposit (a fifth of 80 m²) or all of it. Time is a year off, or living without working.",
          "Each example is the dearest your plan reaches within its years, or else the cheapest. Tap one to add it to your goals.",
          "Living without working: what you take out each month pays a month of life with rent, in the country of your prices.",
          "Flights to Japan or Asia are not included. Nothing is taken from your money: each wish is worked out on its own.",
          "Prices start from your browser's language: es-ES shows Spain's. You can change them. With no prices for your country, the Netherlands'.",
          "Each price names its source and date, and ≈ marks the roughest. [The method and every source](research:wealth-lens/deseos.md).",
        ],
      },
      {
        heading: "Check your plan",
        id: "check",
        body: [
          "Under the result, up to three observations, only when they apply. Each has its euros. They say what is, never what to do.",
          "Few years: your plan's years, or a goal, under 5 years away, and money that goes up and down. It counts how many of the 1,000 possible futures end below what you put in by then. It shows from 1 in 10. [The method](research:wealth-lens/chequeo.md#horizonte-frente-a-riesgo).",
          "One stock: one company over a fifth of your mix or of My portfolio, index funds aside. It gives its euros and its worst fall from a peak, on your money. [The method](research:wealth-lens/chequeo.md#concentración).",
          "Savings for 10 years or more: what the account keeps in today's money, against what you put in. And against world stocks, with the same amounts: what it gives up, and their worst fall. That fall comes from yearly data: within a year it may have been deeper. [The method](research:wealth-lens/chequeo.md#ahorro-a-largo-plazo).",
        ],
      },
      {
        heading: "Countries",
        body: [
          `The table has ${facts.countries} countries. For ${facts.detailed}, the monthly cost for one person comes from Numbeo (without rent) and Wise (rent of a 1-bedroom outside the centre).`,
          `The other ${facts.estimated} are estimated from each country's price level, from the World Bank (${facts.priceYear}). They are marked with ≈.`,
          "How: the Netherlands' costs × how expensive the country is compared with the Netherlands. Rent × that number squared, because rent differs more.",
          `On the ${facts.detailed} detailed countries, the estimate is off by ${facts.medianWithout} without housing and ${facts.medianWith} with housing, in the middle case.`,
          `One in ten is off by ${facts.tenthWithout} or ${facts.tenthWith} or more. Cities also differ a lot from their country's average.`,
          `Left out: countries without enough price data, and those where prices rose over 30% a year (${facts.leftOut}).`,
          "✓ and a year mean what your money pays each month covers it from that year on. Otherwise the table says when your plan gets there.",
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
        heading: "Funds and stocks",
        body: [
          "Once a day, the site downloads prices from Yahoo Finance, or from Stooq if that fails. Your browser never asks them.",
          "It publishes only figures worked out from those prices: the latest price, the change in a year, the worst fall and a weekly line.",
          "That line is each week's change since the start of the period, from 100. It is never a price.",
          "One stock alone is never projected: no one can predict one company. In a mix or My portfolio, a stock grows like its index.",
        ],
      },
      {
        heading: "What it does not do",
        body: [
          "It gives no advice and makes no forecast. It leaves out taxes and most fees.",
          "It does not convert currencies: only holdings in euros count. Figures in dollars or pounds were turned into euros at fixed rates of 28 September 2026.",
        ],
      },
    ],
    sourcesTitle: "Sources",
    sourcesIntro: "Each source, what it gives, how far its data goes, and its terms.",
    source: { link: "Open the source", date: "Data", terms: "Terms" },
    sources: [
      {
        name: "UBS Global Investment Returns Yearbook 2025 (Dimson, Marsh and Staunton), as reported by Cambridge Judge Business School",
        what: "World stocks' yearly growth after rising prices, 1900–2024: 5.2%",
        url: "https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/",
        date: "1900 to 2024",
        terms: "Only this one figure is used: the 5% the calculator starts with.",
      },
      {
        name: "Robert J. Shiller, Yale University",
        what: "S&P 500 yearly growth, and US prices until 2022",
        url: "http://www.econ.yale.edu/~shiller/data.htm",
        date: "to June 2023",
        terms: "Free to use with credit.",
      },
      {
        name: "MSCI",
        what: "MSCI World yearly results",
        url: "https://www.msci.com/indexes/index/990100",
        date: "to December 2024",
        terms: "Its data may not be copied. Only yearly growth worked out from it is published.",
      },
      {
        name: "Nasdaq",
        what: "Nasdaq-100 levels at each year's end",
        url: "https://indexes.nasdaqomx.com/Index/Overview/NDX",
        date: "to December 2024",
        terms: "Its data may not be copied. Only yearly growth worked out from it is published.",
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
        name: "LBMA",
        what: "Gold price at each year's end",
        url: "https://www.lbma.org.uk/prices-and-data/precious-metal-prices",
        date: "to December 2024",
        terms: "Its data may not be copied. Only yearly growth worked out from it is published.",
      },
      {
        name: "Numbeo",
        what: "Cost of living without rent, 30 countries",
        url: "https://www.numbeo.com/cost-of-living/",
        date: "checked July to September 2026",
        terms: "Its data may not be copied. Only rounded euro costs worked out from it are published, with credit.",
      },
      {
        name: "Wise",
        what: "Rent of a 1-bedroom outside the centre, 30 countries",
        url: "https://wise.com/gb/cost-of-living/",
        date: "checked July to September 2026",
        terms: "Its data may not be copied. Only rounded euro costs worked out from it are published, with credit.",
      },
      {
        name: "World Bank, World Development Indicators",
        what: "Price levels (ICP 2021, carried to 2024) and each year's rise in prices",
        url: "https://data.worldbank.org/indicator/PA.NUS.PPPC.RF",
        date: "downloaded 30 September 2026",
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
        name: "Yahoo Finance",
        what: "Daily prices of the listed funds and stocks",
        url: "https://finance.yahoo.com",
        date: "every day",
        terms: "Its data may not be copied. Only figures worked out from it are published, never the price history.",
      },
      {
        name: "Stooq",
        what: "Daily prices, when Yahoo Finance fails",
        url: "https://stooq.com",
        date: "every day",
        terms: "Its data may not be copied. Only figures worked out from it are published, never the price history.",
      },
      {
        name: "Unicode CLDR",
        what: "Country names in each language",
        url: "https://cldr.unicode.org",
        date: "as built into Node.js",
        terms: "Unicode License: free to use with credit.",
      },
    ] as SourceEntry[],
    thingsNote: "Each thing you could buy names its own source and date in the app.",
    licensesTitle: "Data licenses",
    licenses: [
      "Some sources let anyone reuse their data with credit: the World Bank, the OECD, Destatis, the US Bureau of Labor Statistics and Robert Shiller.",
      "Others do not allow copying their data: Yahoo Finance, Stooq, Numbeo, Wise, MSCI, Nasdaq and the LBMA.",
      "From those, Horalis Growth publishes only figures it works out itself: rounded costs, yearly growth, yearly changes, weekly lines from 100 and each fund's latest price.",
      "It never publishes their tables or daily prices, and it always says where a figure comes from.",
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
          "Files you import, like a CSV of holdings or prices, are read the same way, on your device.",
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
          "Prices for wishes and goals start from the same setting: es-ES shows Spain's. Your choice is not stored either.",
          "An older version saved data in the browser. If Horalis Growth finds it, it offers to load it once, then deletes it.",
        ],
      },
      {
        heading: "Prices",
        body: ["Fund and stock prices are downloaded once a day by the site itself, not by your browser. Your visit contacts no one else."],
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
