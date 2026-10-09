/**
 * The privacy and terms page every static Horalis tool publishes (the
 * ones Forja makes): the same promises, in the same words, for each
 * tool. A tool with more to say (files, prices it downloads) writes its
 * own page instead. Texts use "**bold**" and "[words](address)" (html.ts,
 * rich); "hub" and "hub-about" are addresses of the hub.
 */

import { localePath, type Locale } from "./locales.ts";
import { HUB_URL } from "./site.ts";

export interface ProseSection {
  heading: string;
  body: string[];
}

export interface LegalPage {
  title: string;
  description: string;
  updated: string;
  sections: ProseSection[];
}

/** Where the pages are hosted today (docs/hosting.md): one place to change when they move. */
export const HOSTING = {
  name: "Vercel",
  policy: "https://vercel.com/legal/privacy-policy",
} as const;

const PAGES: Readonly<Record<Locale, (name: string) => LegalPage>> = {
  en: (name) => ({
    title: "Privacy and terms",
    description: `${name} keeps nothing you type and sends nothing. No cookies. What the hosting sees, and the terms.`,
    updated: "Updated on 3 October 2026.",
    sections: [
      { heading: "In short", body: ["**Nothing you type is saved or sent.** No cookies. No tracking."] },
      {
        heading: "Your numbers",
        body: [
          "What you type stays in this page, in your browser's memory. Close or reload the tab and it is gone.",
          `${name} has no accounts, no database and no server of its own. Your numbers never leave your device.`,
        ],
      },
      {
        heading: "Cookies and storage",
        body: [
          `${name} uses no cookies. That is why there is no cookie banner.`,
          "It keeps one thing, only if you pick it: light or dark.",
          "That choice stays in this tab's session storage. Closing the tab deletes it.",
          "It is never sent. Choosing “Automatic” deletes it at once.",
          "The first time, the language comes from your browser's settings. Nothing is stored to remember it.",
        ],
      },
      {
        heading: "Hosting",
        body: [
          `The site is hosted by ${HOSTING.name}. To deliver the pages and keep them safe, its servers may record technical data about each visit.`,
          `That can include your IP address, the page asked for, the time and your browser. ${name} does not see or use these records.`,
          `See [${HOSTING.name}'s privacy policy](${HOSTING.policy}).`,
        ],
      },
      {
        heading: "No guarantee",
        body: [
          "Every figure is an estimate from public sources. It can be rough, out of date or wrong.",
          `${name} does not know your whole situation. It does not tell you what to do.`,
          "It is offered as it is, with no warranty of any kind. You use it at your own risk.",
        ],
      },
      {
        heading: "Free to use",
        body: [
          `Anyone can use ${name} for free, on its website.`,
          "The code belongs to Horalis. Without written permission, it may not be copied, changed, shared or used to make other products.",
          "The data belongs to its sources, which keep their rights. Each one is named next to its figures.",
        ],
      },
      { heading: "Questions", body: [`${name} is part of [Horalis](hub). How to reach us is on [its About page](hub-about).`] },
    ],
  }),
  es: (name) => ({
    title: "Privacidad y condiciones",
    description: `${name} no guarda nada de lo que escribes ni envía nada. Sin cookies. Qué ve el alojamiento, y las condiciones.`,
    updated: "Actualizado el 3 de octubre de 2026.",
    sections: [
      { heading: "En resumen", body: ["**No se guarda ni se envía nada de lo que escribes.** Sin cookies. Sin seguimiento."] },
      {
        heading: "Tus números",
        body: [
          "Lo que escribes se queda en esta página, en la memoria de tu navegador. Si cierras o recargas la pestaña, desaparece.",
          `${name} no tiene cuentas, ni base de datos, ni servidor propio. Tus números nunca salen de tu dispositivo.`,
        ],
      },
      {
        heading: "Cookies y almacenamiento",
        body: [
          `${name} no usa cookies. Por eso no hay aviso de cookies.`,
          "Guarda una sola cosa, y solo si la eliges: claro u oscuro.",
          "Esa elección queda en el almacenamiento de sesión de esta pestaña. Al cerrar la pestaña, se borra.",
          "Nunca se envía. Elegir «Automático» la borra al momento.",
          "La primera vez, el idioma sale de la configuración de tu navegador. No se guarda nada para recordarlo.",
        ],
      },
      {
        heading: "Alojamiento",
        body: [
          `El sitio está alojado en ${HOSTING.name}. Para servir las páginas y protegerlas, sus servidores pueden registrar datos técnicos de cada visita.`,
          `Eso puede incluir tu dirección IP, la página pedida, la hora y tu navegador. ${name} no ve ni usa esos registros.`,
          `Mira la [política de privacidad de ${HOSTING.name}](${HOSTING.policy}).`,
        ],
      },
      {
        heading: "Sin garantía",
        body: [
          "Cada cifra es una estimación con datos públicos. Puede ser aproximada, estar desfasada o tener errores.",
          `${name} no conoce toda tu situación. No te dice qué hacer.`,
          "Se ofrece tal cual, sin garantía de ningún tipo. Lo usas bajo tu propia responsabilidad.",
        ],
      },
      {
        heading: "De uso gratuito",
        body: [
          `Cualquiera puede usar ${name} gratis, en su web.`,
          "El código es de Horalis. Sin permiso por escrito, no se puede copiar, modificar, distribuir ni usar para crear otros productos.",
          "Los datos son de sus fuentes, que conservan sus derechos. Cada una aparece junto a sus cifras.",
        ],
      },
      { heading: "Preguntas", body: [`${name} es parte de [Horalis](hub). Cómo escribirnos está en [su página Acerca de](hub-about).`] },
    ],
  }),
};

/** The privacy and terms page of a tool, in a language. */
export function legalPage(locale: Locale, name: string): LegalPage {
  return PAGES[locale](name);
}

/** The hub's addresses the legal texts link to, in the page's language. */
export function legalLink(locale: Locale): (href: string) => string {
  return (href) => (href === "hub" ? HUB_URL : href === "hub-about" ? HUB_URL + localePath("/about/", locale) : href);
}
