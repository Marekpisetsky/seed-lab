/**
 * Las palabras en español de las páginas que el servidor escribe enteras
 * (ver en-pages.ts): solo en el código del servidor.
 */

import type { HowItWorksFacts, ProseSection, SourceEntry } from "../page-types";
import { es } from "./es";
import type { PageMessages } from "./en-pages";

export const esPages: PageMessages = {
  meta: {
    money: { title: "Lo que tu dinero puede hacer", description: "Mira qué podrías hacer con tu dinero, y cuándo. Gratis y privado." },
    test: { title: "Probar mi plan", description: "Tu plan en las crisis de la bolsa, de 1929 a 2022." },
    about: { title: "Acerca de", description: "Qué es Horalis Crecimiento, quién lo hace y por qué es gratis." },
    howItWorks: { title: "Cómo funciona", description: "El método, las cifras y todas las fuentes, con enlaces y fechas." },
    privacy: { title: "Privacidad", description: "No se guarda ni se envía nada de lo que escribes. Sin cookies. Qué registra el alojamiento." },
    terms: { title: "Condiciones", description: "No es consejo financiero. Sin garantía. Úsalo bajo tu responsabilidad." },
  },
  about: {
    title: es.site.footer.about,
    lead: "Horalis Crecimiento muestra lo que puede hacer tu dinero, con palabras sencillas.",
    sections: [
      {
        heading: "Qué es",
        body: [
          "Escribe lo que tienes y lo que añades cada mes. Horalis Crecimiento muestra cómo podría crecer y cuándo podrías hacer un viaje, pagar la entrada de una casa o vivir sin trabajar.",
          "También muestra cuánto podría pagarte al mes y en qué lugares del mundo alcanza.",
          "También puedes [probar tu plan](/test) en grandes caídas del pasado.",
          "Es gratis. No hay registro, ni anuncios, ni seguimiento.",
        ],
      },
      {
        heading: "Parte de Horalis",
        body: ["Horalis Crecimiento es la primera herramienta de [Horalis](hub): herramientas pequeñas y gratuitas, útiles en cualquier país, que dejan tus datos en tu dispositivo."],
      },
      {
        heading: "Quién lo hace",
        body: [
          "Lo hace Marek Pisetsky. Horalis Crecimiento es de uso gratuito. Su código es de Horalis.",
          "¿Preguntas, ideas o un error que contar? Escribe a [email](email).",
        ],
      },
      {
        heading: "Qué no es",
        body: [
          "No es consejo financiero. Nunca te dice qué comprar o vender. Lee las [condiciones](/terms).",
          "Sus cifras vienen del pasado y de fuentes públicas. Mira [cómo funciona](/how-it-works).",
        ],
      },
    ] as ProseSection[],
  },
  howItWorks: {
    title: es.site.footer.howItWorks,
    lead: "Qué hace Horalis Crecimiento con tus números, qué supone y de dónde sale cada cifra.",
    sections: (facts: HowItWorksFacts): ProseSection[] => [
      {
        heading: "Tu dinero crece",
        body: [
          "Empiezas con una cantidad y añades algo cada mes. Cada año el dinero crece un porcentaje, y ese crecimiento también crece.",
          "Todos los importes están en euros de hoy. Los precios suben con el tiempo, así que el crecimiento que ves es después de esa subida.",
          "Cada aporte mensual entra al final de su mes, y sube con los precios.",
        ],
      },
      {
        heading: "Cuánto crece",
        body: [
          "La calculadora empieza en un 5 % al año tras subir los precios. Las acciones del mundo crecieron un 5,2 % al año de 1900 a 2024, según el anuario de UBS de 2025.",
          "Escribe otra cifra o toca un ejemplo. La cifra de un ejemplo usa los años pasados de ese ejemplo. Cualquier otra sube y baja como las acciones de EE. UU.",
          `Cada opción crece a su media de años pasados. Todas usan los mismos años, ${facts.period}, para que ninguna parezca mejor por empezar en una buena década.`,
          "Las acciones suben y bajan. Por eso Horalis Crecimiento calcula 1000 futuros posibles, cada uno barajando años pasados.",
          "«Si va mal» es donde 1 de cada 10 de esos futuros termina por debajo. «Si va bien», donde 1 de cada 10 termina por encima.",
          "«Primeros 10 años como 2000–2009» repite esa década tal como fue y después crece a la media. Bonos y oro fueron bien entonces: toman sus peores diez años.",
          "Una mezcla crece como sus partes, según su peso. Una cuenta de ahorro gana su interés, menos la subida de precios. Tus propios números pueden sustituir cualquiera de estos.",
          "Solo aparecen tipos de activo con una historia pública larga: acciones de EE. UU., bonos alemanes, oro y ahorro. Nunca una empresa o un fondo concretos.",
        ],
      },
      {
        heading: "Lo que puede pagarte",
        body: [
          "Cada mes podrías sacar una parte de tu dinero: tu dinero × 4 % ÷ 12. El deslizador va del 2 % al 7 %.",
          "«Duró 30 años» dice en cuántos de cada 100 futuros posibles esa cantidad duró 30 años.",
          "Prudente: en 90 o más. Arriesgado: en 75 o más. Muy arriesgado: en menos.",
        ],
      },
      {
        heading: "Tus metas",
        body: [
          "Bajo el resultado, Mis metas: solo las que añades tú. Cada una dice cuándo llega tu plan.",
          "Tú das el precio de lo que quieres. El ejemplo en gris solo muestra el tipo de cifra.",
          "Vivir en un país usa lo que vive una persona media allí (ver Países). Vivir sin trabajar usa tus propios gastos al mes, o los de un país como punto de partida.",
          "Nada se resta de tu dinero: cada meta se calcula por separado.",
        ],
      },
      {
        heading: "Chequeo de tu plan",
        id: "check",
        body: [
          "Bajo el resultado, hasta tres observaciones, solo cuando aplican. Cada una con sus euros. Dicen lo que hay, nunca qué hacer.",
          "Pocos años: los años de tu plan, o una meta, a menos de 5 años, con dinero que sube y baja. Cuenta cuántos de los 1000 futuros posibles acaban por debajo de lo que pones hasta entonces. Sale desde 1 de cada 10. [El método](research:wealth-lens/chequeo.md#horizonte-frente-a-riesgo).",
          "Ahorro durante 10 años o más: lo que conserva la cuenta en dinero de hoy, frente a lo que pones. Y frente a las acciones de EE. UU., con las mismas cantidades: lo que se deja de ganar y su peor caída. Esa caída sale de datos anuales: dentro de cada año pudo ser mayor. [El método](research:wealth-lens/chequeo.md#ahorro-a-largo-plazo).",
        ],
      },
      {
        heading: "Países",
        body: [
          `La tabla tiene ${facts.countries} países: los que los datos oficiales del Banco Mundial permiten calcular. Para los demás no se inventa ninguna cifra.`,
          `Cada coste es lo que vive al mes una persona media allí, vivienda incluida. Sale de la media de las encuestas de hogares (${facts.surveyFrom}–${facts.surveyTo}, cada país la última).`,
          `Esa media se lleva a precios de ${facts.priceYear} con los niveles de precios del Banco Mundial.`,
          "Es una media nacional: las ciudades cambian mucho. Unos países miden el gasto y otros el ingreso, y una media la suben los que más tienen.",
          "✓ y un año quieren decir que lo que tu dinero paga al mes lo cubre desde ese año. Si no, la tabla dice cuándo llega tu plan. [El método](research:wealth-lens/coste-de-vida.md).",
        ],
      },
      {
        heading: "La subida de precios de cada país",
        body: [
          "Cada país tiene una subida de precios anual a largo plazo: la meta que publica su banco central, revisada en septiembre de 2026.",
          "Los países del euro usan el 2 % del Banco Central Europeo. Donde no hay meta, es más o menos la media de 2015–2024.",
          `En ${facts.highInflation}, los precios subieron un 10 % al año o más en 2015–2024. Donde hay meta, se usa la meta igualmente.`,
        ],
      },
      {
        heading: "Probar mi plan",
        body: [
          "Tu plan recorre los años pasados en su orden de verdad, sin repeticiones. Las cifras son de años naturales completos.",
          "Cada caída empieza el año anterior. La caída es lo que le hizo al dinero que tenías en lo más alto.",
          "Una caída que se recuperó dentro del mismo año no aparece en cifras anuales. El Covid de 2020 es una de ellas.",
        ],
      },
      {
        heading: "Lo que no hace",
        body: [
          "No da consejos ni hace pronósticos. Deja fuera los impuestos y la mayoría de las comisiones.",
          "No descarga nada mientras lo usas: cada cifra va dentro de la página, con su fuente y su año.",
          "No convierte monedas: todos los importes están en euros.",
        ],
      },
    ],
    sourcesTitle: "Fuentes",
    sourcesIntro: "Cada fuente, lo que da, hasta dónde llegan sus datos y sus condiciones.",
    source: { link: "Abrir la fuente", date: "Datos", terms: "Condiciones" },
    sources: (facts: HowItWorksFacts): SourceEntry[] => [
      {
        name: "UBS Global Investment Returns Yearbook 2025 (Dimson, Marsh y Staunton), según Cambridge Judge Business School",
        what: "Crecimiento anual de las acciones del mundo tras subir los precios, 1900–2024: 5,2 %",
        url: "https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/",
        date: "de 1900 a 2024",
        terms: "Solo se usa esta cifra: el 5 % con el que empieza la calculadora.",
      },
      {
        name: "Robert J. Shiller, Universidad de Yale",
        what: "Crecimiento anual de las acciones de EE. UU. (S&P Composite), y precios de EE. UU. hasta 2022",
        url: "http://www.econ.yale.edu/~shiller/data.htm",
        date: "hasta junio de 2023",
        terms: "Uso libre citando la fuente.",
      },
      {
        name: "OCDE y Deutsche Bundesbank",
        what: "Rentabilidad de los bonos alemanes a 10 años",
        url: "https://www.oecd.org/en/data/indicators/long-term-interest-rates.html",
        date: "hasta diciembre de 2024",
        terms: "Datos de la OCDE: CC BY 4.0, uso libre citando la fuente.",
      },
      {
        name: "Destatis, la oficina de estadística alemana",
        what: "Precios en Alemania",
        url: "https://www.destatis.de/EN/Themes/Economy/Prices/Consumer-Price-Index/_node.html",
        date: "hasta diciembre de 2024",
        terms: "Licencia de datos de Alemania, atribución 2.0: uso libre citando la fuente.",
      },
      {
        name: "Oficina de Estadísticas Laborales de EE. UU.",
        what: "Precios de EE. UU. de 2023 y 2024",
        url: "https://www.bls.gov/cpi/",
        date: "hasta diciembre de 2024",
        terms: "Dominio público.",
      },
      {
        name: "Banco Mundial, precios de materias primas (Pink Sheet)",
        what: "Precio del oro, media de diciembre de cada año",
        url: "https://www.worldbank.org/en/research/commodity-markets",
        date: "hasta diciembre de 2024",
        terms: "CC BY 4.0: uso libre citando la fuente.",
      },
      {
        name: "Banco Mundial, Plataforma de Pobreza y Desigualdad e Indicadores del Desarrollo Mundial",
        what: "Lo que vive una persona media (encuestas de hogares), niveles de precios (PCI 2021) y la subida de precios de cada año",
        url: "https://data.worldbank.org/indicator/SI.SPR.PCAP",
        date: `encuestas hasta ${facts.surveyTo}, precios de ${facts.priceYear}`,
        terms: "CC BY 4.0: uso libre citando la fuente.",
      },
      {
        name: "Bancos centrales",
        what: "Sus metas de subida de precios",
        url: "https://www.bis.org/cbanks.htm",
        date: "revisado en septiembre de 2026",
        terms: "Información pública.",
      },
      {
        name: "Unicode CLDR",
        what: "Los nombres de los países en cada idioma",
        url: "https://cldr.unicode.org",
        date: "los que trae Node.js",
        terms: "Licencia Unicode: uso libre citando la fuente.",
      },
    ],
    licensesTitle: "Licencias de los datos",
    licenses: [
      "Todas las fuentes permiten reutilizar sus datos citándolas: el Banco Mundial, la OCDE, Destatis, la Oficina de Estadísticas Laborales de EE. UU., Robert Shiller y Unicode.",
      "Horalis Crecimiento dice siempre de dónde sale una cifra y de qué año es.",
      "El método y las fuentes son públicos. El código es de Horalis. Los datos conservan los derechos de sus dueños.",
    ],
  },
  privacy: {
    title: es.site.footer.privacy,
    updated: "Actualizado el 7 de octubre de 2026.",
    sections: [
      { heading: "En resumen", body: ["**No se guarda ni se envía nada de lo que escribes.** Sin cookies. Sin seguimiento."] },
      {
        heading: "Tus números",
        body: [
          "Lo que escribes se queda en esta página, en la memoria de tu navegador. Si cierras o recargas la pestaña, desaparece.",
          "Horalis Crecimiento no tiene cuentas, ni base de datos, ni servidor propio. Tus números nunca salen de tu dispositivo.",
          "**Descargar mis datos** guarda un archivo en tu dispositivo. **Cargar mis datos** lee ese archivo en tu dispositivo. No se sube nada.",
        ],
      },
      {
        heading: "Cookies y almacenamiento",
        body: [
          "Horalis Crecimiento no usa cookies. Por eso no hay aviso de cookies.",
          "Guarda una sola cosa, y solo si la eliges: claro u oscuro.",
          "Esa elección queda en el almacenamiento de sesión de esta pestaña. Al cerrar la pestaña, se borra.",
          "Nunca se envía. Elegir «Automático» la borra al momento.",
          "La primera vez, el idioma sale de la configuración de tu navegador. No se guarda nada para recordarlo.",
          "Una versión anterior guardaba datos en el navegador. Si Horalis Crecimiento los encuentra, ofrece cargarlos una vez y después los borra.",
        ],
      },
      {
        heading: "Cifras",
        body: ["Todas las cifras van dentro de la página cuando se construye. Tu visita no descarga nada de nadie más."],
      },
      {
        heading: "Alojamiento",
        body: [
          "El sitio está alojado en Vercel. Para servir las páginas y protegerlas, los servidores de Vercel pueden registrar datos técnicos de cada visita.",
          "Eso puede incluir tu dirección IP, la página pedida, la hora y tu navegador. Horalis Crecimiento no ve ni usa esos registros.",
          "Mira la [política de privacidad de Vercel](https://vercel.com/legal/privacy-policy).",
        ],
      },
      { heading: "Preguntas", body: ["Escribe a [email](email)."] },
    ] as ProseSection[],
  },
  terms: {
    title: es.site.footer.terms,
    updated: "Actualizado el 1 de octubre de 2026.",
    sections: [
      {
        heading: "No es consejo financiero",
        body: [
          "Horalis Crecimiento muestra lo que hacen los números. No te dice qué comprar, vender o hacer.",
          "No conoce toda tu situación: tus impuestos, deudas, familia o planes. Para una decisión grande, habla con un asesor autorizado.",
        ],
      },
      {
        heading: "Sin garantía",
        body: [
          "Cada cifra es una estimación. El crecimiento viene del pasado, y el pasado no promete el futuro.",
          "Los costes de vida y los precios son aproximados y pueden estar desfasados. Horalis Crecimiento puede tener errores.",
          "Se ofrece tal cual, sin garantía de ningún tipo.",
        ],
      },
      {
        heading: "Bajo tu propia responsabilidad",
        body: ["Tú decides qué hacer con tu dinero, y usas Horalis Crecimiento bajo tu propia responsabilidad. Sus autores no responden de pérdidas ni decisiones basadas en él."],
      },
      {
        heading: "De uso gratuito",
        body: [
          "Cualquiera puede usar Horalis Crecimiento gratis, en su web.",
          "El código es de Horalis. Sin permiso por escrito, no se puede copiar, modificar, distribuir ni usar para crear otros productos.",
          "Los nombres y logotipos de Horalis y sus herramientas son marcas. No se pueden usar sin permiso por escrito.",
          "Los datos son de sus fuentes, que conservan sus derechos. [Cómo funciona](/how-it-works) las enumera todas.",
        ],
      },
      { heading: "Cambios", body: ["Estas condiciones pueden cambiar. La fecha de arriba dice cuándo cambiaron por última vez."] },
    ] as ProseSection[],
  },
  notFound: {
    title: "Esta página no existe",
    text: "Quizá la dirección tiene un error, o la página se mudó.",
    home: "Ir a Horalis Crecimiento",
  },
};
