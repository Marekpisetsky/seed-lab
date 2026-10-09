/** Every word of Horalis Cost of Living in Spanish (the shape of en.ts). */

import type { Words } from "./en.ts";

export const es: Words = {
  meta: {
    title: "Horalis Coste de vida: lo que vale tu dinero en otro país",
    description: "Compara el coste de vida entre países, con datos del Banco Mundial. Gratis, y no se guarda nada.",
  },
  home: {
    title: "¿Cuánto vale tu dinero en otro país?",
    lead: (countries: string) => `Compara el coste de vida en ${countries} países, vivienda incluida.`,
    form: "Tu dinero y los dos países",
    amount: (currency: string) => `Dinero al mes (${currency})`,
    from: "Dónde vives ahora",
    to: "Con qué país comparas",
    result: "Para vivir igual",
    sentence: (amount: string, from: string, to: string, need: string) => `Con ${amount} al mes en ${from}, en ${to} necesitarías ${need} para vivir igual.`,
    invalid: "Escribe una cantidad al mes para comparar.",
    rate: (year: string, pair: string) => `Con los tipos oficiales de ${year}: ${pair}.`,
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
      `Llevado a precios de ${facts.year} con los niveles de precios del Banco Mundial. Datos del ${facts.compiled}, licencia CC BY 4.0.`,
      `Cada país en su moneda, al tipo oficial del Banco Mundial de ${facts.year} (media del año, nunca un tipo del día). Sin tipo de ese año, en dólares de EE.\u00a0UU.`,
      "Una persona, al mes. Redondeado a 1 por debajo de 95, a 10 por debajo de 10.000 y a tres cifras por encima. Solo salen países con datos oficiales: no se inventa ninguna cifra.",
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
