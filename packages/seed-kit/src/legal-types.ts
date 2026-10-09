/** A page of prose: sections with a heading and paragraphs ("**bold**", "[words](address)"). */
export interface ProseSection {
  heading: string;
  body: string[];
}

/** The privacy and terms page of a static tool (legal.ts). */
export interface LegalPage {
  title: string;
  description: string;
  updated: string;
  sections: ProseSection[];
}
