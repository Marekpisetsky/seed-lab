import type { Messages } from "./en.ts";

/** Todas las palabras del hub en español. Las mismas reglas que en inglés. */

export const es: Messages = {
  site: {
    name: "seed-lab",
    skip: "Saltar al contenido",
    nav: { label: "Páginas", principles: "Principios", about: "Acerca de" },
    language: "Idioma",
    footerNav: "Más",
    roadmap: "Hoja de ruta",
    noTracking: "Sin cookies. Sin analítica. No se guarda nada sobre ti.",
    weight: (kb: string, compressed: string) => `Esta página pesa ${kb} KB (${compressed} KB comprimida), medido al construirla.`,
    copyright: "© 2026 seed-lab. De uso gratuito.",
  },
  meta: {
    home: {
      title: "seed-lab: herramientas gratuitas y privadas para Europa",
      description: "Herramientas digitales gratuitas que los europeos pueden usar sin renunciar a sus datos. La primera: Wealth Lens.",
    },
    principles: { title: "Principios · seed-lab", description: "Cinco compromisos para cada producto de seed-lab, las reglas que hay detrás y cómo los cumple cada producto." },
    about: { title: "Sobre seed-lab", description: "Qué es seed-lab, hacia dónde va, qué no es y quién lo hace." },
    roadmap: { title: "Hoja de ruta · seed-lab", description: "Los peldaños que seed-lab quiere subir y lo que todavía falta hoy." },
  },
  og: { footer: "De uso gratuito. Tus datos nunca salen de tu dispositivo.", tool: "La primera herramienta: Wealth Lens" },
  home: {
    title: "Herramientas digitales gratuitas y privadas para Europa.",
    mission: "seed-lab crea herramientas digitales gratuitas y centradas en la privacidad que los europeos (ciudadanos, desarrolladores y organismos públicos) pueden usar sin renunciar a sus datos.",
    cta: "Prueba Wealth Lens",
    principlesTitle: "Cinco principios",
    principlesIntro: "Todos los productos de seed-lab los cumplen. Cada uno viene con reglas que cualquiera puede comprobar.",
    principlesLink: "Qué significan en la práctica",
    productKicker: "Nuestra primera herramienta",
    open: (name: string) => `Abrir ${name}`,
    languages: "Idiomas",
  },
  principles: {
    title: "Principios",
    lead: "Cinco compromisos para cada producto de seed-lab. Cada uno viene con reglas que cualquiera puede comprobar.",
    rulesLabel: "En la práctica",
    tableTitle: "Cómo lo cumple cada producto",
    tableIntro: "Comprobado con las reglas de arriba. Lo que falta está en la [hoja de ruta](/roadmap/).",
    product: "Producto",
    status: { meets: "Cumple", partly: "En parte", pending: "Pendiente" },
    items: [
      {
        id: "device",
        title: "Tus datos nunca salen de tu dispositivo.",
        short: "Tus datos se quedan contigo",
        text: "Lo que escribes se calcula en tu dispositivo. Nosotros nunca lo vemos.",
        rules: [
          "Ninguna app envía datos personales a un servidor. Todo se calcula en tu dispositivo.",
          "Sin cuentas, sin cookies, sin analítica, sin rastreo.",
          "No se guarda nada de lo que escribes. Para conservar tu trabajo, guardas tú un archivo.",
          "Mientras usas una página, no pide nada a ningún otro servicio.",
        ],
      },
      {
        id: "transparent",
        title: "Transparente.",
        short: "Transparente",
        text: "De uso gratuito para todos. Nuestros métodos y fuentes de datos son públicos. Nuestro código es nuestro.",
        rules: [
          "Todos los productos son de uso gratuito: sin cuenta, sin anuncios, sin pagos.",
          "Cada método se explica con palabras sencillas en una página pública.",
          "Cada cifra dice de dónde sale, con su fecha.",
          "Los cambios en un método se publican.",
        ],
      },
      {
        id: "europe",
        title: "Europeo de verdad.",
        short: "Europeo de verdad",
        text: "Alojado en Europa, en las lenguas de Europa, y hecho para el RGPD y la Ley Europea de Accesibilidad desde el principio.",
        rules: [
          "Todos los productos se alojan en la UE.",
          "Todo está al menos en inglés y en español, con los números escritos a la manera de cada idioma.",
          "No se tratan datos personales, así que el RGPD no te pide nada.",
          "Cada página cumple WCAG 2.2 AA, comprobado con herramientas y por personas, con una declaración de accesibilidad pública.",
        ],
      },
      {
        id: "light",
        title: "Ligero.",
        short: "Ligero",
        text: "Páginas estáticas y pequeñas: menos energía, menos coste, rápidas con cualquier conexión.",
        rules: [
          "Páginas estáticas, sin servidor propio.",
          "Cada página pesa menos de 350 KB en la primera visita, comprimida. Ese límite se publica aquí.",
          "Cada página saca 95 o más en la prueba para móvil de Lighthouse.",
        ],
      },
      {
        id: "everyone",
        title: "Para todos.",
        short: "Para todos",
        text: "Lo bastante claro para un niño y para su abuelo.",
        rules: [
          "Frases cortas y sin jerga. Una prueba revisa cada texto, en cada idioma.",
          "Todo funciona con teclado y con lector de pantalla. Botones y enlaces miden al menos 44 píxeles de alto.",
          "Las comprobaciones automáticas de accesibilidad pasan en modo claro y oscuro.",
          "Los productos se prueban con personas reales, niños y mayores incluidos.",
        ],
      },
    ],
  },
  roadmap: {
    title: "Hoja de ruta",
    lead: "Hacia dónde va seed-lab, peldaño a peldaño, y lo que todavía falta hoy.",
    ladderTitle: "Los peldaños",
    ladderIntro: "Cada peldaño empieza solo cuando el anterior cumple su condición.",
    here: "Estamos aquí",
    notYet: "Todavía no",
    next: "Siguiente peldaño cuando",
    steps: [
      { what: "Herramientas que la gente usa. Hoy: Wealth Lens.", until: "la gente las siga usando, mes tras mes." },
      { what: "Herramientas gratuitas para desarrolladores que otros adoptan.", until: "otros construyan sobre ellas sin que se lo pidamos." },
      { what: "Una plataforma de la que dependen otros: alojamiento, datos e identidad europeos.", until: "" },
      { what: "Infraestructura a escala continental.", until: "" },
    ],
    missingTitle: "Lo que falta",
    missingIntro: "Lo que hay detrás de cada «En parte» y «Pendiente» de la página de [principios](/principles/).",
    missing: [
      "Llevar todos los productos a un alojamiento en la UE. Hoy funcionan en Vercel, en EE. UU.",
      "Encontrar un sitio europeo para el código. Hoy se guarda en GitHub, en EE. UU.",
      "Más de las 24 lenguas oficiales de la UE. Hoy: inglés y español.",
      "Una auditoría WCAG hecha por personas y una declaración de accesibilidad pública.",
      "Pruebas con personas reales, niños y mayores incluidos.",
      "Una lista pública de los cambios en cada método.",
      "Sustituir las fuentes que no permiten compartir sus datos, como Yahoo Finance, Numbeo y MSCI.",
    ],
    blocksTitle: "Herramientas gratuitas para desarrolladores",
    blocksIntro: "Wealth Lens está hecha de piezas que otras herramientas podrían reutilizar. Queremos publicarlas una a una. Todavía no hay ninguna publicada.",
    planned: "Previsto",
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
          "Es una dirección, no algo que exista. **Hoy estamos en el primer peldaño: herramientas que la gente usa.** La [hoja de ruta](/roadmap/) muestra los siguientes.",
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
        body: ["Lo hace Marek Pisetsky. Las herramientas son de uso gratuito. Su código es de seed-lab.", "¿Preguntas o ideas? Escribe a [email](email)."],
      },
      {
        heading: "Esta web",
        body: [
          "Sin cookies, sin analítica, sin rastreo. Es HTML y CSS, más dos scripts mínimos: uno elige tu idioma y otro convierte el correo en un enlace.",
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
