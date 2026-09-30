/**
 * Every word the app shows in English. Short sentences a 10-12 year old
 * reads without help (about ten words at most), and no jargon: the words
 * "real", "nominal", "volatility", "swings" and "percentile" only appear in
 * `explain`, the folded "i" texts (checked by plain-language.test.ts).
 *
 * es.ts has the same shape: a key missing there does not compile.
 */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const en = {
  site: {
    name: "Wealth Lens",
    skip: "Skip to content",
    tagline: "What your money can do, in plain words.",
    nav: { label: "Pages", money: "My money", test: "Test my plan", stocks: "My stocks" },
    language: "Language",
    footerNote: "Nothing is saved or sent. Not financial advice.",
  },
  meta: {
    money: { title: "What your money can do", description: "See how your money grows, what it pays you each month, and where it goes far. Free, private, no sign-up." },
    test: { title: "Test my plan", description: "Your plan through real market crashes: 1929, 2000, 2008, 2020, 2022." },
    stocks: { title: "My stocks", description: "What you hold, what you gained, and how each fund did each year." },
    about: { title: "About", description: "What Wealth Lens is, who makes it, and why it is free." },
    howItWorks: { title: "How it works", description: "The method, the figures behind it and every source, with links and dates." },
    privacy: { title: "Privacy", description: "Nothing is saved or sent. No cookies. What the hosting logs." },
    terms: { title: "Terms", description: "Not financial advice. No guarantee. Use it at your own risk." },
  },
  money: { title: "My money" },
  stocks: { title: "My stocks", question: "What do I have, and how did it do?" },
  units: {
    months: (n: number) => plural(n, "month", "months"),
    years: (n: number) => plural(n, "year", "years"),
    never: "never",
  },
  when: {
    now: "now",
    notAtThisPace: "not at this pace",
    /** "in 12 years", "in 12 years (2038)". */
    inSpan: (span: string, year: number | null) => `in ${span}${year === null ? "" : ` (${year})`}`,
  },
};

export type Messages = typeof en;
