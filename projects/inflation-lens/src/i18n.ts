/**
 * Every word of Inflation Lens, in each language, with the same shape (a test
 * checks it) and in plain words (seed-kit's check: no jargon, short
 * sentences). The header, the footer's links and the privacy page bring
 * their own words from seed-kit.
 */

import type { Locale } from "../../../packages/seed-kit/src/locales.ts";

const en = {
  meta: {
    title: "Inflation Lens: how much did it change?",
    description: "Type a number before and after. See the change, in amount and in percent.",
  },
  home: {
    title: "How much did it change?",
    lead: "A price, a salary or a bill: type it before and after.",
    form: "Your numbers",
    before: "Before",
    after: "After",
    result: "The change",
    up: (percent: string) => `It went up ${percent}.`,
    down: (percent: string) => `It went down ${percent}.`,
    same: "It did not change.",
    fromZero: "It started at zero, so there is no percent.",
    difference: (amount: string) => `Difference: ${amount}.`,
    invalid: "Type two numbers to see the change.",
    private: "Worked out in your browser. Nothing is saved or sent.",
  },
  footer: {
    note: "Nothing is saved or sent. Free to use.",
    weight: (kb: string) => `This page weighs ${kb} KB compressed, measured when it was built.`,
  },
  notFound: {
    title: "This page does not exist",
    text: "Maybe the address has a typo, or the page moved.",
    home: "Go to Inflation Lens",
  },
};

export type Words = typeof en;

const es: Words = {
  meta: {
    title: "Inflation Lens: ¿cuánto ha cambiado?",
    description: "Escribe un número antes y después. Mira el cambio, en cantidad y en porcentaje.",
  },
  home: {
    title: "¿Cuánto ha cambiado?",
    lead: "Un precio, un sueldo o una factura: escríbelo antes y después.",
    form: "Tus números",
    before: "Antes",
    after: "Después",
    result: "El cambio",
    up: (percent: string) => `Subió un ${percent}.`,
    down: (percent: string) => `Bajó un ${percent}.`,
    same: "No cambió.",
    fromZero: "Empezó en cero, así que no hay porcentaje.",
    difference: (amount: string) => `Diferencia: ${amount}.`,
    invalid: "Escribe dos números para ver el cambio.",
    private: "Se calcula en tu navegador. No se guarda ni se envía nada.",
  },
  footer: {
    note: "No se guarda ni se envía nada. De uso gratuito.",
    weight: (kb: string) => `Esta página pesa ${kb} KB comprimida, medido al construirla.`,
  },
  notFound: {
    title: "Esta página no existe",
    text: "Quizá la dirección tiene un error, o la página se mudó.",
    home: "Ir a Inflation Lens",
  },
};

export const WORDS: Readonly<Record<Locale, Words>> = { en, es };
