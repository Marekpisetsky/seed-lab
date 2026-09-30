/** The shapes of the long pages' texts (About, How it works, Privacy, Terms), the same in every language. */

export interface ProseSection {
  heading: string;
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
  countries: number;
  detailed: number;
  estimated: number;
  medianWithout: string;
  medianWith: string;
  tenthWithout: string;
  tenthWith: string;
  /** Countries left out for prices rising over 30% a year, by name. */
  leftOut: string;
  /** Countries whose prices rose 10% a year or more in 2015–2024, by name. */
  highInflation: string;
  priceYear: number;
}
