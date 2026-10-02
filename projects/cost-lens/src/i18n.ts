/**
 * Every word of Cost Lens, in each language, with the same shape (a test
 * checks it) and in plain words (seed-kit's check: no jargon, short
 * sentences). The header, the footer's links and the privacy page bring
 * their own words from seed-kit.
 */

import type { Locale } from "../../../packages/seed-kit/src/locales.ts";

const en = {
  meta: {
    title: "Cost Lens: what your money is worth in another country",
    description: "Compare the cost of living in 172 countries, with and without housing. Free, and nothing is saved.",
  },
  home: {
    title: "What is your money worth in another country?",
    lead: (countries: string) => `Compare the cost of living in ${countries} countries, with and without housing.`,
    form: "Your money and the two countries",
    amount: "Money a month (€)",
    from: "Where you live now",
    to: "Where you compare",
    result: "To live the same",
    sentence: (amount: string, from: string, to: string, need: string) => `With ${amount} a month in ${from}, in ${to} you would need ${need} to live the same.`,
    withoutRent: (need: string) => `Leaving housing out: ${need}.`,
    invalid: "Type an amount a month to compare.",
    estimatedNote: "≈ This country's costs are estimated from its price level.",
    private: "Worked out in your browser. Nothing is saved or sent.",
    furthest: (amount: string) => `Where ${amount} goes furthest`,
    least: (amount: string) => `Where ${amount} goes least far`,
    yourMoney: "your money",
    listsIntro: (from: string) => `×2 means it buys twice as much as in ${from}.`,
    country: "Country",
    withRent: "With housing",
    withoutRentShort: "Without housing",
    times: (value: string) => `×${value}`,
    estimated: "estimated",
    sourcesTitle: "Where the numbers come from",
    sources: (facts: { detailed: string; estimated: string; month: string; year: string; compiled: string }) => [
      `${facts.detailed} countries come from Numbeo (costs without rent) and Wise (rent of a one-bedroom flat outside the centre), from ${facts.month}.`,
      `The other ${facts.estimated}, marked ≈, take the Netherlands' costs times how expensive the country is next to it (World Bank, ${facts.year}).`,
      "Rent uses that number squared, because rent differs more between countries than other prices.",
      `One person, a month, in euros, rounded to €10. Put together on ${facts.compiled}.`,
      "Country averages hide big differences between cities. These are estimates, not live prices.",
    ],
  },
  footer: {
    note: "Nothing is saved or sent. Free to use.",
    weight: (kb: string) => `This page weighs ${kb} KB compressed, measured when it was built.`,
  },
  notFound: {
    title: "This page does not exist",
    text: "Maybe the address has a typo, or the page moved.",
    home: "Go to Cost Lens",
  },
};

export type Words = typeof en;

const es: Words = {
  meta: {
    title: "Cost Lens: lo que vale tu dinero en otro país",
    description: "Compara el coste de vida en 172 países, con y sin vivienda. Gratis, y no se guarda nada.",
  },
  home: {
    title: "¿Cuánto vale tu dinero en otro país?",
    lead: (countries: string) => `Compara el coste de vida en ${countries} países, con y sin vivienda.`,
    form: "Tu dinero y los dos países",
    amount: "Dinero al mes (€)",
    from: "Dónde vives ahora",
    to: "Con qué país comparas",
    result: "Para vivir igual",
    sentence: (amount: string, from: string, to: string, need: string) => `Con ${amount} al mes en ${from}, en ${to} necesitarías ${need} para vivir igual.`,
    withoutRent: (need: string) => `Sin contar la vivienda: ${need}.`,
    invalid: "Escribe una cantidad al mes para comparar.",
    estimatedNote: "≈ Los costes de este país se estiman con su nivel de precios.",
    private: "Se calcula en tu navegador. No se guarda ni se envía nada.",
    furthest: (amount: string) => `Donde ${amount} rinde más`,
    least: (amount: string) => `Donde ${amount} rinde menos`,
    yourMoney: "tu dinero",
    listsIntro: (from: string) => `×2 quiere decir que compra el doble que en ${from}.`,
    country: "País",
    withRent: "Con vivienda",
    withoutRentShort: "Sin vivienda",
    times: (value: string) => `×${value}`,
    estimated: "estimado",
    sourcesTitle: "De dónde salen los números",
    sources: (facts: { detailed: string; estimated: string; month: string; year: string; compiled: string }) => [
      `${facts.detailed} países salen de Numbeo (gastos sin alquiler) y Wise (alquiler de un piso de un dormitorio fuera del centro), de ${facts.month}.`,
      `Los otros ${facts.estimated}, marcados con ≈, usan los costes de Países Bajos ajustados a lo caro que es cada país (Banco Mundial, ${facts.year}).`,
      "El alquiler usa ese número al cuadrado, porque el alquiler cambia más entre países que los demás precios.",
      `Una persona, al mes, en euros, redondeado a 10\u00a0€. Reunido el ${facts.compiled}.`,
      "La media de un país esconde grandes diferencias entre ciudades. Son estimaciones, no precios en directo.",
    ],
  },
  footer: {
    note: "No se guarda ni se envía nada. De uso gratuito.",
    weight: (kb: string) => `Esta página pesa ${kb} KB comprimida, medido al construirla.`,
  },
  notFound: {
    title: "Esta página no existe",
    text: "Quizá la dirección tiene un error, o la página se mudó.",
    home: "Ir a Cost Lens",
  },
};

export const WORDS: Readonly<Record<Locale, Words>> = { en, es };
