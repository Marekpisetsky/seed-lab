/**
 * The words seed-kit itself writes, in Spanish: the header and footer of
 * every Horalis page (chrome.ts) and the privacy and terms page of the
 * static tools (legal.ts). One file per language: adding a language takes
 * a file like this one, its entry in ../locales.ts and its index entry.
 */

import { HOSTING } from "../hosting.ts";
import type { LegalPage } from "../legal-types.ts";
import type { KitWords } from "./index.ts";

export const chrome = {
  skip: "Saltar al contenido",
  pages: "Páginas",
  language: "Idioma",
  launcher: "Herramientas de Horalis",
  hub: "Horalis",
  hubNote: "Todas las herramientas de Horalis",
  tools: "Herramientas",
  here: "Estás aquí",
  more: "Más",
  theme: "Tema",
  themes: { auto: "Automático", light: "Claro", dark: "Oscuro" },
  themeAuto: "Como tu dispositivo",
  themeNote: "Solo se recuerda en esta pestaña.",
  partOf: "Parte de Horalis",
  copyright: "© 2026 Horalis. De uso gratuito.",
  reviewNote: "Esta traducción espera la revisión de un hablante nativo.",
} satisfies KitWords["chrome"];

export const legal = (name: string): LegalPage => ({
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
});
