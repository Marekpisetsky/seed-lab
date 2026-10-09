/**
 * Every word of Horalis Cost of Living in Dutch (the shape of en.ts).
 *
 * PENDING REVIEW BY A NATIVE SPEAKER ("pendiente de revisión por un
 * nativo"): built, but hidden from the language switch, the sitemap and
 * search engines until Marek approves it.
 */

import type { Words } from "./en.ts";

export const nl: Words = {
  meta: {
    title: "Horalis Kosten van levensonderhoud: wat je geld waard is in een ander land",
    description: "Vergelijk de kosten van levensonderhoud tussen landen, met gegevens van de Wereldbank. Gratis, en er wordt niets bewaard.",
  },
  home: {
    title: "Wat is je geld waard in een ander land?",
    lead: (countries: string) => `Vergelijk de kosten van levensonderhoud in ${countries} landen, wonen inbegrepen.`,
    form: "Je geld en de twee landen",
    amount: (currency: string) => `Geld per maand (${currency})`,
    from: "Waar je nu woont",
    to: "Waarmee je vergelijkt",
    result: "Om even goed te leven",
    sentence: (amount: string, from: string, to: string, need: string) => `Met ${amount} per maand in ${from} zou je in ${to} ${need} nodig hebben om even goed te leven.`,
    invalid: "Typ een bedrag per maand om te vergelijken.",
    rate: (year: string, pair: string) => `Met de officiële koersen van ${year}: ${pair}.`,
    private: "Berekend in je browser. Er wordt niets bewaard of verstuurd.",
    furthest: (amount: string) => `Waar ${amount} het verst reikt`,
    least: (amount: string) => `Waar ${amount} het minst ver reikt`,
    yourMoney: "je geld",
    listsIntro: (from: string) => `×2: je koopt er twee keer zoveel mee als in ${from}.`,
    country: "Land",
    goesFurther: "Reikt verder",
    times: (value: string) => `×${value}`,
    sourcesTitle: "Waar de getallen vandaan komen",
    sources: (facts: { surveys: string; year: string; compiled: string; provisional: boolean }) => [
      `Waarvan een gemiddeld persoon in elk land leeft, wonen inbegrepen: de huishoudenquêtes van de Wereldbank (${facts.surveys}, per land de laatste).`,
      `Omgerekend naar de prijzen van ${facts.year} met de prijsniveaus van de Wereldbank. Gegevens van ${facts.compiled}, licentie CC BY 4.0.`,
      `Elk land in zijn eigen munt, tegen de officiële koers van de Wereldbank van ${facts.year} (een jaargemiddelde, nooit een dagkoers). Zonder koers voor dat jaar, in Amerikaanse dollars.`,
      "Eén persoon, per maand. Afgerond op 1 onder 95, op 10 onder 10.000 en op drie cijfers daarboven. Alleen landen met officiële gegevens staan erin: er wordt geen cijfer verzonnen.",
      ...(facts.provisional ? ["Voorlopig: gelezen uit een openbare kopie van de gegevens van de Wereldbank, tot de jaarlijkse download."] : []),
      "Een landelijk gemiddelde: steden verschillen sterk. Sommige landen meten uitgaven, andere inkomen.",
    ],
  },
  footer: {
    note: "Er wordt niets bewaard of verstuurd. Gratis te gebruiken.",
    weight: (kb: string) => `Deze pagina weegt ${kb} kB gecomprimeerd, gemeten bij het bouwen.`,
  },
  notFound: {
    title: "Deze pagina bestaat niet",
    text: "Misschien is het adres fout, of is de pagina verhuisd.",
    home: "Naar Horalis Kosten van levensonderhoud",
  },
};
