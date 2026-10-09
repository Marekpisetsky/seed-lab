/** The shapes of the long pages' texts (About, How it works, Privacy, Terms), the same in every language. */

export interface ProseSection {
  heading: string;
  /** An anchor other pages link to ("check": /how-it-works#check). */
  id?: string;
  /** Paragraphs; "**bold**" and "[words](/page)" or "[words](https://…)" links (components/ui/marked.tsx). */
  body: string[];
}

export interface SourceEntry {
  name: string;
  what: string;
  url: string;
  /** How far the data goes, or when it was checked. */
  date: string;
  /** What its terms allow, and what Wealth Lens publishes from it. */
  terms: string;
}

/** Figures How it works quotes from the data itself, already written the page language's way. */
export interface HowItWorksFacts {
  period: string;
  /** How many countries the cost-of-living table has. */
  countries: number;
  /** The year of the prices of the table. */
  priceYear: number;
  /** The oldest and newest household surveys behind it. */
  surveyFrom: number;
  surveyTo: number;
  /** Countries whose prices rose 10% a year or more in 2015–2024, by name. */
  highInflation: string;
  /** The official data are a provisional copy (seed-kit official/data.ts): the page says so. */
  provisional: boolean;
}

