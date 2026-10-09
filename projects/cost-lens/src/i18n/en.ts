/**
 * Every word of Horalis Cost of Living in English. Each language has its
 * own file with the same shape (a test checks it), in plain words
 * (seed-kit's check: no jargon, short sentences). The header, the footer's
 * links and the privacy page bring their own words from seed-kit.
 */

export const en = {
  meta: {
    title: "Horalis Cost of Living: what your money is worth in another country",
    description: "Compare the cost of living between countries, from World Bank data. Free, and nothing is saved.",
  },
  home: {
    title: "What is your money worth in another country?",
    lead: (countries: string) => `Compare the cost of living in ${countries} countries, housing included.`,
    form: "Your money and the two countries",
    amount: (currency: string) => `Money a month (${currency})`,
    from: "Where you live now",
    to: "Where you compare",
    result: "To live the same",
    sentence: (amount: string, from: string, to: string, need: string) => `With ${amount} a month in ${from}, in ${to} you would need ${need} to live the same.`,
    invalid: "Type an amount a month to compare.",
    rate: (year: string, pair: string) => `At the official rates of ${year}: ${pair}.`,
    inDollars: (country: string, year: string) => `${country}: in US dollars, with no official rate for ${year}.`,
    private: "Worked out in your browser. Nothing is saved or sent.",
    furthest: (amount: string) => `Where ${amount} goes furthest`,
    least: (amount: string) => `Where ${amount} goes least far`,
    yourMoney: "your money",
    listsIntro: (from: string) => `×2 means it buys twice as much as in ${from}.`,
    country: "Country",
    goesFurther: "Goes further",
    times: (value: string) => `×${value}`,
    sourcesTitle: "Where the numbers come from",
    sources: (facts: { surveys: string; year: string; compiled: string; provisional: boolean }) => [
      `What an average person lives on in each country, housing included: the World Bank's household surveys (${facts.surveys}, each country its latest).`,
      `Brought to ${facts.year} prices with the World Bank's price levels. Data of ${facts.compiled}, licence CC BY 4.0.`,
      `Each country in its own currency, at the World Bank's official rate for ${facts.year} (a yearly average, never a live rate). Without a rate for that year, in US dollars.`,
      "One person, a month. Rounded to 1 under 95, to 10 under 10,000, and to three figures above. Only countries with official data are listed: no figure is invented.",
      ...(facts.provisional ? ["Provisional: read from a public copy of the World Bank's data, until the yearly download."] : []),
      "A national average: cities differ a lot. Some countries measure spending, others income.",
    ],
  },
  footer: {
    note: "Nothing is saved or sent. Free to use.",
    weight: (kb: string) => `This page weighs ${kb} KB compressed, measured when it was built.`,
  },
  notFound: {
    title: "This page does not exist",
    text: "Maybe the address has a typo, or the page moved.",
    home: "Go to Horalis Cost of Living",
  },
};

export type Words = typeof en;
