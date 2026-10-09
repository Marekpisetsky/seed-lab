/**
 * Every word of Horalis Inflation, in each language, with the same shape (a
 * test checks it) and in plain words (seed-kit's check: no jargon, short
 * sentences). The header, the footer's links and the privacy page bring
 * their own words from seed-kit.
 */

import type { Locale } from "../../../packages/seed-kit/src/locales.ts";

const en = {
  meta: {
    title: "Horalis Inflation: what your euros from back then are worth today",
    description: "How prices rose in each EU country and the euro area. Data from Eurostat. Free, and nothing is saved.",
  },
  groups: {
    EA: { name: "Euro area", sentence: "the euro area" },
    EU: { name: "European Union", sentence: "the European Union" },
  },
  home: {
    title: "What are your euros from back then worth today?",
    lead: "Prices in every EU country and the euro area, year by year. Data from Eurostat.",
    form: "Your amount, year and place",
    amount: "Amount (€)",
    year: "Year",
    place: "Country or area",
    direction: "Which way",
    toToday: "From that year to today",
    toThen: "From today to that year",
    result: "What it is worth",
    worthToday: (amount: string, year: string, place: string, value: string, today: string) => `${amount} in ${year} in ${place} are worth ${value} today (${today}).`,
    worthThen: (amount: string, today: string, year: string, place: string, value: string) => `${amount} today (${today}) were worth ${value} in ${year} in ${place}.`,
    rose: (percent: string, year: string) => `Prices rose ${percent} since ${year}.`,
    fell: (percent: string, year: string) => `Prices fell ${percent} since ${year}.`,
    key: (amount: string, year: string, value: string) => `${amount} from ${year} buy today what ${value} bought then.`,
    invalid: "Type an amount and pick a year with data.",
    timeline: "Year by year",
    timelineLabel: (place: string, from: string, to: string) => `How much prices rose each year in ${place}, from ${from} to ${to}.`,
    since: (year: string) => `Since ${year}`,
    tableYear: "Year",
    tableRate: "Prices rose",
    showYears: "Show every year",
    provisionalTitle: "Provisional figures",
    provisional: "These figures were typed by hand from Eurostat's tables. They may differ a little from Eurostat's latest.",
    private: "Worked out in your browser. Nothing is saved or sent.",
    sourcesTitle: "Where the numbers come from",
    sources: (facts: { retrieved: string; today: string }) => [
      "Eurostat's harmonised index of consumer prices, all items: how much prices rose on average each year.",
      `"Today" is ${facts.today}, the last full year in the data. Each year is the average of its twelve months.`,
      "The euro area is counted as it was each year. Older years are not in every country's data yet.",
      `Free to reuse with credit: Creative Commons Attribution 4.0. Source: Eurostat. Taken on ${facts.retrieved}.`,
    ],
    sourceLink: "See Eurostat's table",
    licenseLink: "Eurostat's reuse terms",
  },
  footer: {
    note: "Nothing is saved or sent. Free to use.",
    weight: (kb: string) => `This page weighs ${kb} KB compressed, measured when it was built.`,
  },
  notFound: {
    title: "This page does not exist",
    text: "Maybe the address has a typo, or the page moved.",
    home: "Go to Horalis Inflation",
  },
};

export type Words = typeof en;

const es: Words = {
  meta: {
    title: "Horalis Inflación: lo que valen hoy tus euros de entonces",
    description: "Cómo subieron los precios en la UE y la zona euro. Datos de Eurostat. Gratis, y no se guarda nada.",
  },
  groups: {
    EA: { name: "Zona euro", sentence: "la zona euro" },
    EU: { name: "Unión Europea", sentence: "la Unión Europea" },
  },
  home: {
    title: "¿Cuánto valen hoy tus euros de entonces?",
    lead: "Los precios de cada país de la UE y la zona euro. Año a año, con datos de Eurostat.",
    form: "Tu cantidad, el año y el lugar",
    amount: "Cantidad (€)",
    year: "Año",
    place: "País o zona",
    direction: "En qué sentido",
    toToday: "De ese año a hoy",
    toThen: "De hoy a ese año",
    result: "Lo que vale",
    worthToday: (amount: string, year: string, place: string, value: string, today: string) => `${amount} de ${year} en ${place} valen hoy ${value} (${today}).`,
    worthThen: (amount: string, today: string, year: string, place: string, value: string) => `${amount} de hoy (${today}) valían ${value} en ${year} en ${place}.`,
    rose: (percent: string, year: string) => `Los precios subieron un ${percent} desde ${year}.`,
    fell: (percent: string, year: string) => `Los precios bajaron un ${percent} desde ${year}.`,
    key: (amount: string, year: string, value: string) => `${amount} de ${year} compran hoy lo que ${value} entonces.`,
    invalid: "Escribe una cantidad y elige un año con datos.",
    timeline: "Año a año",
    timelineLabel: (place: string, from: string, to: string) => `Cuánto subieron los precios cada año en ${place}, de ${from} a ${to}.`,
    since: (year: string) => `Desde ${year}`,
    tableYear: "Año",
    tableRate: "Subida de precios",
    showYears: "Ver todos los años",
    provisionalTitle: "Cifras provisionales",
    provisional: "Estas cifras se escribieron a mano a partir de las tablas de Eurostat. Pueden diferir un poco de las últimas de Eurostat.",
    private: "Se calcula en tu navegador. No se guarda ni se envía nada.",
    sourcesTitle: "De dónde salen los números",
    sources: (facts: { retrieved: string; today: string }) => [
      "El índice armonizado de precios de consumo de Eurostat, todos los productos: cuánto subieron los precios de media cada año.",
      `«Hoy» es ${facts.today}, el último año completo de los datos. Cada año es la media de sus doce meses.`,
      "La zona euro se cuenta como era cada año. Los años más antiguos aún no están en los datos de todos los países.",
      `De uso libre citando la fuente: Creative Commons Reconocimiento 4.0. Fuente: Eurostat. Tomado el ${facts.retrieved}.`,
    ],
    sourceLink: "Ver la tabla de Eurostat",
    licenseLink: "Las condiciones de reutilización de Eurostat",
  },
  footer: {
    note: "No se guarda ni se envía nada. De uso gratuito.",
    weight: (kb: string) => `Esta página pesa ${kb} KB comprimida, medido al construirla.`,
  },
  notFound: {
    title: "Esta página no existe",
    text: "Quizá la dirección tiene un error, o la página se mudó.",
    home: "Ir a Horalis Inflación",
  },
};

export const WORDS: Readonly<Record<Locale, Words>> = { en, es };
