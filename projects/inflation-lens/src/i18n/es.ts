/** Every word of Horalis Inflation in Spanish (the shape of en.ts). */

import type { Words } from "./en.ts";

export const es: Words = {
  meta: {
    title: "Horalis Inflación: lo que vale hoy el dinero de entonces",
    description: "Cómo subieron los precios en la UE y la zona euro. Datos de Eurostat. Gratis, y no se guarda nada.",
  },
  groups: {
    EA: { name: "Zona euro", sentence: "la zona euro" },
    EU: { name: "Unión Europea", sentence: "la Unión Europea" },
  },
  home: {
    title: "¿Cuánto vale hoy el dinero de entonces?",
    lead: "Los precios de cada país de la UE y la zona euro. Año a año, con datos de Eurostat.",
    form: "Tu cantidad, el año y el lugar",
    amount: (currency: string) => `Cantidad (${currency})`,
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
      "Cada cantidad va en la moneda de hoy del lugar. La inflación cambia lo que compra, no la moneda.",
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
