/**
 * Every word of Horalis Cost of Living, in each language, with the same shape (a test
 * checks it) and in plain words (seed-kit's check: no jargon, short
 * sentences). The header, the footer's links and the privacy page bring
 * their own words from seed-kit.
 */

import type { Locale } from "../../../packages/seed-kit/src/locales.ts";

const en = {
  meta: {
    title: "Horalis Cost of Living: what your money is worth in another country",
    description: "Compare the cost of living between countries, from World Bank data. Free, and nothing is saved.",
  },
  home: {
    title: "What is your money worth in another country?",
    lead: (countries: string) => `Compare the cost of living in ${countries} countries, housing included.`,
    form: "Your money and the two countries",
    amount: "Money a month (€)",
    from: "Where you live now",
    to: "Where you compare",
    result: "To live the same",
    sentence: (amount: string, from: string, to: string, need: string) => `With ${amount} a month in ${from}, in ${to} you would need ${need} to live the same.`,
    invalid: "Type an amount a month to compare.",
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
      `Brought to ${facts.year} prices with the World Bank's price levels, and to euros at that year's official rate. Data of ${facts.compiled}, licence CC BY 4.0.`,
      "One person, a month, rounded to €10 (to €1 under €100). Only countries with official data are listed: no figure is invented.",
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

const es: Words = {
  meta: {
    title: "Horalis Coste de vida: lo que vale tu dinero en otro país",
    description: "Compara el coste de vida entre países, con datos del Banco Mundial. Gratis, y no se guarda nada.",
  },
  home: {
    title: "¿Cuánto vale tu dinero en otro país?",
    lead: (countries: string) => `Compara el coste de vida en ${countries} países, vivienda incluida.`,
    form: "Tu dinero y los dos países",
    amount: "Dinero al mes (€)",
    from: "Dónde vives ahora",
    to: "Con qué país comparas",
    result: "Para vivir igual",
    sentence: (amount: string, from: string, to: string, need: string) => `Con ${amount} al mes en ${from}, en ${to} necesitarías ${need} para vivir igual.`,
    invalid: "Escribe una cantidad al mes para comparar.",
    private: "Se calcula en tu navegador. No se guarda ni se envía nada.",
    furthest: (amount: string) => `Donde ${amount} rinde más`,
    least: (amount: string) => `Donde ${amount} rinde menos`,
    yourMoney: "tu dinero",
    listsIntro: (from: string) => `×2 quiere decir que compra el doble que en ${from}.`,
    country: "País",
    goesFurther: "Rinde más",
    times: (value: string) => `×${value}`,
    sourcesTitle: "De dónde salen los números",
    sources: (facts: { surveys: string; year: string; compiled: string; provisional: boolean }) => [
      `Con lo que vive una persona media en cada país, vivienda incluida: las encuestas de hogares del Banco Mundial (${facts.surveys}, cada país la última).`,
      `Llevado a precios de ${facts.year} con los niveles de precios del Banco Mundial, y a euros al tipo oficial de ese año. Datos del ${facts.compiled}, licencia CC BY 4.0.`,
      "Una persona, al mes, redondeado a 10\u00a0€ (a 1\u00a0€ por debajo de 100\u00a0€). Solo salen países con datos oficiales: no se inventa ninguna cifra.",
      ...(facts.provisional ? ["Provisional: leído de una copia pública de los datos del Banco Mundial, hasta la descarga anual."] : []),
      "Es una media nacional: las ciudades cambian mucho. Unos países miden el gasto y otros, el ingreso.",
    ],
  },
  footer: {
    note: "No se guarda ni se envía nada. De uso gratuito.",
    weight: (kb: string) => `Esta página pesa ${kb} KB comprimida, medido al construirla.`,
  },
  notFound: {
    title: "Esta página no existe",
    text: "Quizá la dirección tiene un error, o la página se mudó.",
    home: "Ir a Horalis Coste de vida",
  },
};

export const WORDS: Readonly<Record<Locale, Words>> = { en, es };
