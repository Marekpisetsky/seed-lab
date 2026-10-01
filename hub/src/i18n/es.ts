import type { Messages } from "./en.ts";

/** Todas las palabras del hub en español. Las mismas reglas que en inglés. */

export const es: Messages = {
  site: {
    name: "seed-lab",
    skip: "Saltar al contenido",
    nav: { label: "Páginas", principles: "Principios", about: "Acerca de" },
    language: "Idioma",
    footerNav: "Más",
    noTracking: "Sin cookies. Sin analítica. No se guarda nada sobre ti.",
    weight: (kb: string, compressed: string) => `Esta página pesa ${kb} KB (${compressed} KB comprimida), medido al construirla.`,
    copyright: "© 2026 seed-lab. De uso gratuito.",
  },
  meta: {
    home: {
      title: "seed-lab: herramientas gratuitas y privadas para Europa",
      description: "Herramientas digitales gratuitas que los europeos pueden usar sin renunciar a sus datos. La primera: Wealth Lens.",
    },
    principles: { title: "Principios · seed-lab", description: "Cinco principios, cómo los cumple hoy Wealth Lens y qué falta todavía." },
    about: { title: "Sobre seed-lab", description: "Qué es seed-lab, hacia dónde va, qué no es y quién lo hace." },
  },
  home: {
    kicker: "seed-lab",
    title: "Herramientas digitales gratuitas y privadas para Europa.",
    mission: "seed-lab crea herramientas digitales gratuitas y centradas en la privacidad que los europeos (ciudadanos, desarrolladores y organismos públicos) pueden usar sin renunciar a sus datos.",
    principlesTitle: "Cinco principios",
    principlesLink: "Cómo los cumplimos y qué falta todavía",
    toolsTitle: "Herramientas",
    toolsIntro: "Por ahora, una. Es la prueba de que estos principios funcionan.",
    open: (name: string) => `Abrir ${name}`,
    languages: "Idiomas",
    blocksTitle: "Bloques para desarrolladores",
    blocksIntro: [
      "Wealth Lens está hecha de piezas que otras herramientas podrían reutilizar. Queremos publicarlas como herramientas gratuitas para desarrolladores, una a una.",
      "**Todavía no hay ninguna publicada.** Hoy viven dentro de Wealth Lens.",
    ],
  },
  status: { live: "Disponible", coming: "Próximamente" },
  principles: {
    title: "Principios",
    lead: "Cinco principios, cómo los cumple hoy Wealth Lens y qué falta todavía.",
    today: "Wealth Lens hoy",
    missing: "Qué falta",
    pending: "Pendiente",
    items: [
      {
        id: "device",
        title: "Tus datos nunca salen de tu dispositivo.",
        short: "Tus datos se quedan contigo",
        text: "Todo se calcula en tu dispositivo. Sin cuentas, sin cookies, sin analítica y sin un servidor que guarde nada sobre ti.",
        today: [
          "Cada cifra se calcula en tu navegador.",
          "No se guarda nada: cierras la pestaña y desaparece. Para conservar tu plan, descargas un archivo.",
          "Los archivos que cargas se leen en tu dispositivo y nunca se suben.",
          "Los precios los descarga la propia web una vez al día, no tu navegador.",
        ],
        missing: [
          { text: "Como cualquier alojamiento web, el actual ve datos técnicos de cada visita, como la dirección IP.", pending: false },
        ],
      },
      {
        id: "transparent",
        title: "Transparente: gratis para todos, métodos y fuentes públicos.",
        short: "Transparente",
        text: "De uso gratuito para todos. Nuestros métodos y fuentes de datos son públicos. Nuestro código es nuestro.",
        today: [
          "De uso gratuito: sin cuenta, sin anuncios, sin pagos.",
          "Una página explica el método con palabras sencillas y enumera cada fuente, con su enlace y su fecha.",
          "Cada cifra dice de dónde sale.",
        ],
        missing: [
          { text: "Algunas fuentes, como Yahoo Finance, Numbeo y MSCI, no permiten compartir sus datos. Solo se pueden mostrar cifras calculadas a partir de ellos.", pending: true },
          { text: "Los cambios en el método todavía no se registran en ningún sitio.", pending: true },
        ],
      },
      {
        id: "europe",
        title: "Europeo de verdad.",
        short: "Europeo de verdad",
        text: "Alojado en Europa, en las lenguas de Europa, y hecho para cumplir el RGPD y la Ley Europea de Accesibilidad desde el principio.",
        today: [
          "Inglés y español, con los números escritos a la manera de cada idioma.",
          "Las comprobaciones automáticas (axe y Lighthouse) no encuentran errores de accesibilidad.",
          "No guarda datos personales, así que no hay nada que pedir consentimiento.",
        ],
        missing: [
          { text: "Está alojado en Vercel, una empresa de EE. UU. Pasar a un alojamiento europeo está previsto, pero aún no se ha hecho.", pending: true },
          { text: "El código se guarda en GitHub, también de EE. UU. Todavía hay que elegirle un sitio europeo.", pending: true },
          { text: "Dos de las 24 lenguas oficiales de la UE. Faltan más.", pending: true },
          { text: "No hay todavía una auditoría WCAG completa hecha por una persona ni una declaración de accesibilidad.", pending: true },
        ],
      },
      {
        id: "light",
        title: "Ligero: páginas estáticas y pequeñas.",
        short: "Ligero",
        text: "Las páginas estáticas y pequeñas gastan menos energía, cuestan menos y cargan rápido con cualquier conexión.",
        today: [
          "Páginas estáticas, sin llamadas a otros servicios mientras las usas.",
          "Cada página saca 95 o más en la prueba para móvil de Lighthouse.",
          "Este hub no usa ningún framework de JavaScript. Su peso aparece al pie de cada página.",
        ],
        missing: [{ text: "Las páginas de Wealth Lens llevan un framework de JavaScript. Pesan más que este hub y deberían aligerarse.", pending: true }],
      },
      {
        id: "everyone",
        title: "Para todos.",
        short: "Para todos",
        text: "Lo bastante claro para un niño y para su abuelo: frases cortas, sin jerga, y funciona con teclado o con lector de pantalla.",
        today: [
          "Una prueba mantiene las frases cortas y sin jerga, en los dos idiomas.",
          "Las palabras difíciles se explican en una nota breve que puedes abrir.",
          "Botones y enlaces miden al menos 44 píxeles de alto, fáciles de tocar.",
        ],
        missing: [{ text: "Todavía no hay pruebas con personas reales, niños y mayores incluidos.", pending: true }],
      },
    ],
  },
  about: {
    title: "Sobre seed-lab",
    lead: "Qué es seed-lab, hacia dónde va y qué no es.",
    sections: [
      {
        heading: "Qué es seed-lab",
        body: [
          "seed-lab crea herramientas digitales gratuitas y centradas en la privacidad para Europa.",
          "Publicamos herramientas gratuitas. Ciudadanos, desarrolladores e instituciones las adoptan por su cuenta.",
          "[Wealth Lens](wealth-lens) es la primera herramienta y la prueba de nuestros [principios](/principles/).",
        ],
      },
      {
        heading: "Hacia dónde va",
        body: [
          "A largo plazo: que Europa tenga su propia pila tecnológica, para que sus ciudadanos, empresas y gobiernos no dependan de la de nadie más.",
          "Es una dirección, no algo que exista. **Hoy estamos en el primer peldaño: herramientas que la gente usa.** Herramientas para desarrolladores, una plataforma e infraestructura vendrían después, y solo si el peldaño anterior funciona.",
        ],
      },
      {
        heading: "Qué no somos",
        body: [
          "No vendemos a gobiernos ni hacemos consultoría. Cualquiera, también una institución, puede usar gratis lo que publicamos.",
          "No recogemos datos. Ni cuentas, ni cookies, ni analítica.",
          "No somos una institución de la UE. No hablamos en su nombre ni usamos sus símbolos.",
        ],
      },
      {
        heading: "Quién lo hace",
        body: [
          "Lo hace [Marek Pisetsky](author). Las herramientas son de uso gratuito. Su código es de seed-lab.",
          "¿Preguntas o ideas? [Abre un issue en GitHub](issues). No hay correo, a propósito.",
        ],
      },
      {
        heading: "Esta web",
        body: [
          "Sin cookies, sin analítica, sin rastreo. Es HTML y CSS, más una línea de script que elige tu idioma.",
          "Por ahora está alojada en Vercel, en EE. UU., igual que Wealth Lens. Queremos llevar las dos a un alojamiento europeo.",
        ],
      },
    ],
  },
  notFound: {
    title: "Esta página no existe",
    text: "Quizá la dirección tiene una errata, o la página se movió.",
    home: "Ir a seed-lab",
  },
};
