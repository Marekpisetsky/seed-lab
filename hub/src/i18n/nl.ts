/**
 * Every word of the hub in Dutch.
 *
 * PENDING REVIEW BY A NATIVE SPEAKER ("pendiente de revisión por un
 * nativo"): written without one. The Dutch pages are built but hidden from
 * the language switch, the sitemap and search engines until Marek approves
 * them (seed-kit locales.ts, `pendingReview`).
 */

import type { Messages } from "./en.ts";

export const nl: Messages = {
  site: {
    name: "Horalis",
    nav: { principles: "Principes", about: "Over" },
    roadmap: "Routekaart",
    noTracking: "Geen cookies. Geen analytics. Er wordt niets over je bewaard.",
    weight: (kb: string, compressed: string) => `Deze pagina weegt ${kb} kB (${compressed} kB gecomprimeerd), gemeten bij het bouwen.`,
  },
  meta: {
    home: {
      title: "Horalis: gratis, privé tools voor elk land",
      description: "Gratis, privé digitale tools die in elk land werken, gemaakt in Europa. Niets wat je typt verlaat je apparaat. Eerste tool: Horalis Groei.",
    },
    principles: { title: "Principes · Horalis", description: "Vijf beloften voor elk Horalis-product, de regels erachter en hoe elk product ze nakomt." },
    about: { title: "Over · Horalis", description: "Wat Horalis is, waar het heen gaat, wat het niet is en wie het maakt." },
    roadmap: { title: "Routekaart · Horalis", description: "De stappen die Horalis wil zetten, en wat er vandaag nog ontbreekt." },
  },
  og: { footer: "Gratis te gebruiken. Je gegevens verlaten je apparaat nooit.", tool: "Eerste tool: Horalis Groei" },
  home: {
    title: "Horalis. Je uren, van jou.",
    mission: "Gratis, privé digitale tools die in elk land werken, gemaakt in Europa. Elke berekening gebeurt op je apparaat.",
    cta: "Probeer Horalis Groei",
    heroAlt: "Horalis Groei: wat € 10.000 en € 300 per maand in 20 jaar kunnen worden, met een grafiek.",
    principlesKicker: "Principes",
    principlesTitle: "Vijf principes, elk met een regel die je kunt nagaan",
    principlesIntro: "Elk Horalis-product houdt zich eraan. Bij elk horen regels die iedereen kan nagaan, en wat nog ontbreekt is openbaar.",
    principlesLink: "Wat ze in de praktijk betekenen",
    toolsKicker: "Tools",
    toolsTitle: (count: number): string => (count === 1 ? "Een tool voor elke dag" : "Tools voor elke dag"),
    toolsIntro: "Gratis, in je browser, en er wordt niets verstuurd.",
    status: { live: "Online", beta: "Beta" },
    open: (name: string) => `${name} openen`,
    cardAlt: (name: string) => `${name}, zoals het eruitziet op een computer.`,
    languages: "Talen",
    buildKicker: "Hoe we bouwen",
    buildTitle: "Een fabriek, haar onderdelen en onderzoek",
    buildIntro: "We beginnen nooit bij nul. Elke nieuwe tool staat op wat de andere al bewezen.",
    buildSteps: [
      { name: "Forja", title: "De fabriek", text: "Ze maakt elke nieuwe tool op de gedeelde basis, met tests die al slagen." },
      { name: "seed-kit", title: "De onderdelen", text: "Kleuren, kop- en voettekst, talen, privacy en de controles die elke pagina doorstaat." },
      { name: "Onderzoek", title: "Het onderzoek", text: "Het kiest en toetst elke methode. Geen methode verandert zonder haar eigen fiche." },
    ],
    diagram: {
      label: "Hoe een tool wordt gebouwd",
      base: "seed-kit",
      parts: ["kleuren", "kop- en voettekst", "talen", "privacy", "controles"],
      mould: "Forja maakt hem",
      next: "Een nieuwe tool",
      hub: "Deze site",
      research: "kiest en toetst de methodes",
    },
    buildClosing: "Zo is elke tool vanaf dag één privé, licht en in het Engels en Spaans. Elke methode heeft haar fiche, met bronnen en grenzen.",
    differentKicker: "Wat ons anders maakt",
    differentTitle: "Wat een gewone app van je vraagt, en wat wij vragen",
    differentIntro: "We noemen niemand. Dit zijn gewoontes die vaak voorkomen op het web.",
    typical: "Een gewone app",
    ours: "Horalis",
    rows: [
      { label: "Een account", typical: "Vaak verplicht", ours: "Nooit" },
      { label: "Volgen", typical: "Analytics en advertentietrackers", ours: "Geen" },
      { label: "Je gegevens", typical: "Op hun servers bewaard", ours: "Blijven op je apparaat" },
      { label: "Advertenties", typical: "Vaak", ours: "Nooit" },
    ],
    weightLabel: "Gewicht van een pagina",
    weightTypical: (kb: string) => `Ongeveer ${kb} kB: de mediane webpagina op een telefoon`,
    weightOurs: (kb: string) => `Hoogstens ${kb} kB op deze site, gemeten bij het bouwen`,
    weightSource: "De mediaan komt uit de [HTTP Archive Web Almanac 2024](https://almanac.httparchive.org/en/2024/page-weight).",
    figuresKicker: "In cijfers",
    figuresTitle: "Gemeten bij het bouwen van deze site",
    figures: {
      cookies: "cookies",
      trackers: "trackers",
      weight: "kB hoogstens per pagina",
      languages: "talen",
      countries: "landen in onze gegevens",
      tools: (count: number): string => (count === 1 ? "tool gebouwd op het platform" : "tools gebouwd op het platform"),
    },
  },
  principles: {
    title: "Principes",
    lead: "Vijf beloften voor elk Horalis-product. Bij elk horen regels die iedereen kan nagaan.",
    rulesLabel: "In de praktijk",
    tableTitle: "Hoe elk product ze nakomt",
    tableIntro: "Getoetst aan de regels hierboven. Wat nog ontbreekt, staat op de [routekaart](/roadmap/).",
    product: "Product",
    status: { meets: "Voldoet", partly: "Deels", pending: "Nog niet" },
    items: [
      {
        id: "device",
        homeRule: 0,
        title: "Je gegevens verlaten je apparaat nooit.",
        short: "Je gegevens blijven op je apparaat",
        text: "Wat je typt, wordt op je apparaat berekend. Wij zien het nooit.",
        rules: [
          "Geen app stuurt persoonlijke gegevens naar een server. Alles wordt op je apparaat berekend.",
          "Geen accounts, geen cookies, geen analytics, geen volgen.",
          "Niets wat je typt verlaat je apparaat of blijft langer dan het tabblad. Om je werk te houden, sla je zelf een bestand op.",
          "Terwijl je een pagina gebruikt, vraagt ze niets aan een andere dienst.",
        ],
      },
      {
        id: "transparent",
        homeRule: 0,
        title: "Open.",
        short: "Open",
        text: "Gratis te gebruiken voor iedereen. Onze methodes en bronnen zijn openbaar. Onze code is van ons.",
        rules: [
          "Elk product is gratis te gebruiken: geen account, geen advertenties, niets te betalen.",
          "Elke methode wordt in gewone woorden uitgelegd op een openbare pagina.",
          "Elk cijfer zegt waar het vandaan komt, met de datum.",
          "Wijzigingen aan een methode worden openbaar bijgehouden.",
        ],
      },
      {
        id: "europe",
        homeRule: 1,
        title: "Echt Europees.",
        short: "Echt Europees",
        text: "Gehost in Europa, in de talen van Europa, en vanaf het begin gebouwd voor de AVG en de Europese toegankelijkheidswet.",
        rules: [
          "Elk product wordt in de EU gehost.",
          "Alles is minstens in het Engels en Spaans, met getallen zoals elke taal ze schrijft.",
          "Er worden geen persoonsgegevens verwerkt, dus de AVG vraagt niets van je.",
          "Elke pagina voldoet aan WCAG 2.2 AA, gecontroleerd door tools en door mensen, met een openbare toegankelijkheidsverklaring.",
        ],
      },
      {
        id: "light",
        homeRule: 1,
        title: "Licht.",
        short: "Licht",
        text: "Kleine statische pagina's: minder energie, minder kosten, snel op elke verbinding.",
        rules: [
          "Statische pagina's, zonder eigen server.",
          "Elke pagina weegt bij een eerste bezoek minder dan 350 kB, gecomprimeerd. Die grens staat hier.",
          "Elke pagina scoort 95 of meer in de telefoontest van Lighthouse.",
        ],
      },
      {
        id: "everyone",
        homeRule: 0,
        title: "Voor iedereen.",
        short: "Voor iedereen",
        text: "Duidelijk genoeg voor een kind en zijn grootouder.",
        rules: [
          "Korte zinnen en geen vakjargon. Een test controleert elke tekst, in elke taal.",
          "Alles werkt met een toetsenbord en een schermlezer. Knoppen en links zijn minstens 44 pixels hoog.",
          "Automatische toegankelijkheidscontroles slagen in lichte en donkere weergave.",
          "Producten worden getest met echte mensen, ook kinderen en ouderen.",
        ],
      },
    ],
  },
  roadmap: {
    title: "Routekaart",
    lead: "Waar Horalis heen gaat, stap voor stap, en wat er vandaag nog ontbreekt.",
    ladderTitle: "De stappen",
    ladderIntro: "Elke stap begint pas als de vorige aan haar voorwaarde voldoet.",
    here: "Hier zijn we",
    notYet: "Nog niet",
    next: "Volgende stap als",
    steps: [
      { what: "Tools die mensen gebruiken. Vandaag: Horalis Groei.", until: "mensen ze blijven gebruiken, maand na maand." },
      { what: "Gratis tools voor ontwikkelaars die anderen overnemen.", until: "anderen erop bouwen zonder dat het gevraagd wordt." },
      { what: "Een platform waar anderen op steunen: Europese hosting, gegevens en identiteit.", until: "" },
      { what: "Infrastructuur op de schaal van een continent.", until: "" },
    ],
    missingTitle: "Wat nog ontbreekt",
    missingIntro: "De gaten achter elke Deels en Nog niet op de pagina [principes](/principles/).",
    missing: [
      "Elk product naar een host in de EU brengen. Vandaag draaien ze op Vercel, in de VS.",
      "Een Europees thuis voor de code vinden. Vandaag staat ze op GitHub, in de VS.",
      "Meer van de 24 officiële talen van de EU. Vandaag: Engels en Spaans.",
      "Een WCAG-audit door mensen, en een openbare toegankelijkheidsverklaring.",
      "Tests met echte mensen, ook kinderen en ouderen.",
      "Een openbare lijst van wijzigingen aan elke methode.",
    ],
    blocksTitle: "Gratis tools voor ontwikkelaars",
    blocksIntro: "Horalis Groei bestaat uit onderdelen die andere tools kunnen hergebruiken. We willen ze een voor een publiceren. Nog geen enkel is gepubliceerd.",
    planned: "Gepland",
  },
  about: {
    title: "Over",
    lead: "Wat Horalis is, waar het heen gaat, en wat het niet is.",
    sections: [
      {
        heading: "Wat Horalis is",
        body: [
          "Horalis maakt gratis, privé digitale tools die in elk land werken. Ze worden gemaakt in Europa.",
          "We publiceren gratis tools. Burgers, ontwikkelaars en instellingen nemen ze zelf over.",
          "[Horalis Groei](wealth-lens) is de eerste tool, en het bewijs van onze [principes](/principles/).",
        ],
      },
      {
        heading: "Waar het heen gaat",
        body: [
          "Op lange termijn: informatie die niet meer centraal wordt bewaard en gevolgd. Elke berekening gebeurt op je eigen apparaat, en geen tool heeft een centrale server nodig.",
          "Dat is een richting, niet iets wat al bestaat. **Vandaag zijn we bij de eerste stap: tools die mensen gebruiken.** De [routekaart](/roadmap/) toont de stappen daarna.",
        ],
      },
      {
        heading: "Wat we niet zijn",
        body: [
          "We verkopen niet aan overheden en doen geen advieswerk. Iedereen, ook instellingen, kan wat we publiceren gratis gebruiken.",
          "We verzamelen geen gegevens. Geen accounts, geen cookies, geen analytics.",
          "We zijn geen instelling van de EU. We spreken niet namens haar en gebruiken haar symbolen niet.",
        ],
      },
      {
        heading: "Wie het maakt",
        body: [
          "Het wordt gemaakt door Marek Pisetsky. De tools zijn gratis te gebruiken. Hun code is van Horalis.",
          "Vragen of ideeën? Stuur een [e-mail](email).",
        ],
      },
      {
        heading: "Deze site",
        body: [
          "Geen cookies, geen analytics, geen volgen. Het is gewone HTML en CSS, met drie kleine scripts.",
          "Een kiest je taal. Een houdt licht of donker vast, alleen in dit tabblad, tot je het sluit. Een maakt van het e-mailadres een link.",
          "Voorlopig wordt het gehost op Vercel, in de VS, net als Horalis Groei. Een verhuizing naar een Europese host is gepland.",
        ],
      },
    ],
  },
  notFound: {
    title: "Deze pagina bestaat niet",
    text: "Misschien is het adres fout, of is de pagina verhuisd.",
    home: "Naar Horalis",
  },
};
