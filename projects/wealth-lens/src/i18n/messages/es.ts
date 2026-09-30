import type { Messages } from "./en";

/** Todo lo que la app dice en español: frases cortas, sin jerga (ver en.ts). */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const es: Messages = {
  site: {
    name: "Wealth Lens",
    skip: "Ir al contenido",
    tagline: "Lo que tu dinero puede hacer, en palabras simples.",
    nav: { label: "Páginas", money: "Mi dinero", test: "Pon a prueba tu plan", stocks: "Mis acciones" },
    language: "Idioma",
    footerNote: "No se guarda ni se envía nada. No es consejo financiero.",
  },
  meta: {
    money: { title: "Lo que tu dinero puede hacer", description: "Mira cómo crece tu dinero, cuánto te paga al mes y dónde te alcanza. Gratis, privado, sin registro." },
    test: { title: "Pon a prueba tu plan", description: "Tu plan en caídas reales de la bolsa: 1929, 2000, 2008, 2020, 2022." },
    stocks: { title: "Mis acciones", description: "Lo que tienes, lo que ganaste y cómo le fue a cada fondo cada año." },
    about: { title: "Acerca de", description: "Qué es Wealth Lens, quién lo hace y por qué es gratis." },
    howItWorks: { title: "Cómo funciona", description: "El método, las cifras y todas las fuentes, con enlaces y fechas." },
    privacy: { title: "Privacidad", description: "No se guarda ni se envía nada. Sin cookies. Qué registra el hosting." },
    terms: { title: "Condiciones", description: "No es consejo financiero. Sin garantía. Úsalo bajo tu responsabilidad." },
  },
  money: { title: "Mi dinero" },
  stocks: { title: "Mis acciones", question: "¿Qué tengo y cómo le ha ido?" },
  units: {
    months: (n: number) => plural(n, "mes", "meses"),
    years: (n: number) => plural(n, "año", "años"),
    never: "nunca",
  },
  when: {
    now: "ahora",
    notAtThisPace: "no a este ritmo",
    inSpan: (span: string, year: number | null) => `en ${span}${year === null ? "" : ` (${year})`}`,
  },
};
