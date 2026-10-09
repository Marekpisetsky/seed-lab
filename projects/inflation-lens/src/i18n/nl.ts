/**
 * Every word of Horalis Inflation in Dutch (the shape of en.ts).
 *
 * PENDING REVIEW BY A NATIVE SPEAKER ("pendiente de revisión por un
 * nativo"): built, but hidden from the language switch, the sitemap and
 * search engines until Marek approves it.
 */

import type { Words } from "./en.ts";

export const nl: Words = {
  meta: {
    title: "Horalis Inflatie: wat geld van toen vandaag waard is",
    description: "Hoe de prijzen stegen in elk EU-land en de eurozone. Gegevens van Eurostat. Gratis, en er wordt niets bewaard.",
  },
  groups: {
    EA: { name: "Eurozone", sentence: "de eurozone" },
    EU: { name: "Europese Unie", sentence: "de Europese Unie" },
  },
  home: {
    title: "Wat is geld van toen vandaag waard?",
    lead: "De prijzen in elk EU-land en de eurozone, jaar na jaar. Gegevens van Eurostat.",
    form: "Je bedrag, het jaar en de plaats",
    amount: (currency: string) => `Bedrag (${currency})`,
    year: "Jaar",
    place: "Land of gebied",
    direction: "Welke kant op",
    toToday: "Van dat jaar naar vandaag",
    toThen: "Van vandaag naar dat jaar",
    result: "Wat het waard is",
    worthToday: (amount: string, year: string, place: string, value: string, today: string) => `${amount} in ${year} in ${place} is vandaag ${value} waard (${today}).`,
    worthThen: (amount: string, today: string, year: string, place: string, value: string) => `${amount} van vandaag (${today}) was in ${year} in ${place} ${value} waard.`,
    rose: (percent: string, year: string) => `De prijzen stegen ${percent} sinds ${year}.`,
    fell: (percent: string, year: string) => `De prijzen daalden ${percent} sinds ${year}.`,
    key: (amount: string, year: string, value: string) => `Met ${amount} uit ${year} koop je vandaag wat ${value} toen kocht.`,
    invalid: "Typ een bedrag en kies een jaar met gegevens.",
    timeline: "Jaar na jaar",
    timelineLabel: (place: string, from: string, to: string) => `Hoeveel de prijzen elk jaar stegen in ${place}, van ${from} tot ${to}.`,
    since: (year: string) => `Sinds ${year}`,
    tableYear: "Jaar",
    tableRate: "Prijsstijging",
    showYears: "Toon elk jaar",
    provisionalTitle: "Voorlopige cijfers",
    provisional: "Deze cijfers zijn met de hand overgenomen uit de tabellen van Eurostat. Ze kunnen iets afwijken van de laatste van Eurostat.",
    private: "Berekend in je browser. Er wordt niets bewaard of verstuurd.",
    sourcesTitle: "Waar de getallen vandaan komen",
    sources: (facts: { retrieved: string; today: string }) => [
      "De geharmoniseerde consumentenprijsindex van Eurostat, alle producten: hoeveel de prijzen elk jaar gemiddeld stegen.",
      `„Vandaag" is ${facts.today}, het laatste volledige jaar in de gegevens. Elk jaar is het gemiddelde van zijn twaalf maanden.`,
      "De eurozone wordt geteld zoals ze elk jaar was. Oudere jaren staan nog niet in de gegevens van elk land.",
      "Elk bedrag is in de munt die de plaats vandaag heeft. Inflatie verandert wat je ermee koopt, niet de munt.",
      `Vrij te hergebruiken met bronvermelding: Creative Commons Naamsvermelding 4.0. Bron: Eurostat. Opgehaald op ${facts.retrieved}.`,
    ],
    sourceLink: "Bekijk de tabel van Eurostat",
    licenseLink: "De hergebruikvoorwaarden van Eurostat",
  },
  footer: {
    note: "Er wordt niets bewaard of verstuurd. Gratis te gebruiken.",
    weight: (kb: string) => `Deze pagina weegt ${kb} kB gecomprimeerd, gemeten bij het bouwen.`,
  },
  notFound: {
    title: "Deze pagina bestaat niet",
    text: "Misschien is het adres fout, of is de pagina verhuisd.",
    home: "Naar Horalis Inflatie",
  },
};
