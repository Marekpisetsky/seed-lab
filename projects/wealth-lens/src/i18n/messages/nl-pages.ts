/**
 * De Nederlandse woorden van de pagina's die de server helemaal schrijft
 * (zie en-pages.ts): alleen in de code van de server.
 *
 * PENDING REVIEW BY A NATIVE SPEAKER ("pendiente de revisión por un nativo"):
 * written without one; built but hidden from the language switch, sitemaps
 * and search engines until Marek approves it.
 */

import type { HowItWorksFacts, ProseSection, SourceEntry } from "../page-types";
import { nl } from "./nl";
import type { PageMessages } from "./en-pages";

export const nlPages: PageMessages = {
  meta: {
    money: { title: "Wat je geld kan doen", description: "Zie wat je met je geld zou kunnen doen, en wanneer. Gratis en privé." },
    test: { title: "Test mijn plan", description: "Je plan door de beurscrises uit de geschiedenis, van 1929 tot 2022." },
    about: { title: "Over", description: "Wat Horalis Groei is, wie het maakt en waarom het gratis is." },
    howItWorks: { title: "Hoe het werkt", description: "De methode en elke bron, met links en data." },
    privacy: { title: "Privacy", description: "Niets wat je typt wordt bewaard of verstuurd. Geen cookies. Wat de hosting vastlegt." },
    terms: { title: "Voorwaarden", description: "Geen financieel advies. Geen garantie. Gebruik op eigen risico." },
  },
  about: {
    title: nl.site.footer.about,
    lead: "Horalis Groei laat zien wat je geld kan doen, in gewone woorden.",
    sections: [
      {
        heading: "Wat het is",
        body: [
          "Typ wat je hebt en wat je elke maand inlegt. Horalis Groei laat zien hoe het kan groeien. En wanneer je op reis kunt, een huis kunt aanbetalen of zonder werk kunt leven.",
          "Het laat ook zien wat het je elke maand kan uitbetalen, en waar in de wereld dat genoeg is.",
          "Je kunt je plan ook [testen](/test) tegen grote crashes uit het verleden.",
          "Het is gratis. Er is geen aanmelding, geen reclame en geen tracking.",
        ],
      },
      {
        heading: "Onderdeel van Horalis",
        body: ["Horalis Groei is het eerste hulpmiddel van [Horalis](hub): kleine, gratis hulpmiddelen voor elk land, die je gegevens op je apparaat houden."],
      },
      {
        heading: "Wie het maakt",
        body: [
          "Het wordt gemaakt door Marek Pisetsky. Horalis Groei is gratis te gebruiken. De code is van Horalis.",
          "Vragen, ideeën of een fout gevonden? Schrijf naar [email](email).",
        ],
      },
      {
        heading: "Wat het niet is",
        body: [
          "Het is geen financieel advies. Het vertelt je nooit wat te kopen of te verkopen. Lees de [voorwaarden](/terms).",
          "De cijfers komen uit het verleden en uit openbare bronnen. Zie [hoe het werkt](/how-it-works).",
        ],
      },
    ] as ProseSection[],
  },
  howItWorks: {
    title: nl.site.footer.howItWorks,
    lead: "Wat Horalis Groei met je getallen doet, wat het aanneemt, en waar elk cijfer vandaan komt.",
    sections: (facts: HowItWorksFacts): ProseSection[] => [
      {
        heading: "Je geld groeit",
        body: [
          "Je begint met een bedrag en legt elke maand iets in. Elk jaar groeit het geld met een percentage, en die groei groeit ook.",
          "Alle bedragen zijn in geld van vandaag, in de munt die je kiest. Prijzen stijgen in de loop van de tijd, dus de groei die je ziet is groei na prijsstijging.",
          "Elk maandbedrag gaat erin aan het eind van zijn maand, en het stijgt mee met de prijzen.",
        ],
      },
      {
        heading: "Hoeveel het groeit",
        body: [
          "De rekenmachine begint bij 5% per jaar na prijsstijging. Wereldaandelen groeiden 5,2% per jaar van 1900 tot 2024, volgens het UBS Global Investment Returns Yearbook 2025.",
          "Typ een ander getal, of tik op een voorbeeld. Een voorbeeld gebruikt zijn eigen jaren uit het verleden. Elk ander getal gaat op en neer zoals Amerikaanse aandelen.",
          `Elke keuze groeit met haar gemiddelde uit het verleden. Alle gebruiken dezelfde jaren, ${facts.period}, zodat geen enkele beter lijkt door een goed startdecennium.`,
          "Aandelen gaan op en neer. Daarom berekent Horalis Groei 1000 mogelijke toekomsten, die elk jaren uit het verleden door elkaar schudden.",
          "“Als het slecht gaat” is waar 1 op de 10 van die toekomsten onder eindigt. “Als het goed gaat” is waar 1 op de 10 boven eindigt.",
          "“Eerste 10 jaar zoals 2000–2009” speelt dat decennium af zoals het ging, en groeit daarna met het gemiddelde. Obligaties en goud deden het toen goed, dus die nemen hun slechtste tien jaar.",
          "Een mix groeit zoals zijn delen, naar gewicht. Een spaarrekening levert haar rente op, min prijsstijging. Je eigen getallen kunnen elk hiervan vervangen.",
          "Alleen soorten beleggingen met een lange openbare geschiedenis staan erin: Amerikaanse aandelen, Duitse staatsobligaties, goud en sparen. Nooit één bedrijf of fonds.",
        ],
      },
      {
        heading: "Wat het je kan uitbetalen",
        body: [
          "Elke maand kun je een deel van je geld opnemen: je geld × 4% ÷ 12. De schuifregelaar gaat van 2% tot 7%.",
          "“Het hield 30 jaar stand” zegt in hoeveel van de 100 mogelijke toekomsten dat bedrag 30 jaar meeging.",
          "Voorzichtig: in 90 of meer. Riskant: in 75 of meer. Zeer riskant: in minder.",
        ],
      },
      {
        heading: "Je doelen",
        body: [
          "Onder het resultaat staat Mijn doelen: alleen de doelen die je zelf toevoegt. Elk zegt wanneer je plan er is.",
          "Je geeft zelf de prijs van wat je wilt. Het grijze voorbeeld laat alleen zien wat voor getal het is.",
          "Wonen in een land gebruikt waarvan een gemiddeld persoon daar leeft (zie Landen). Leven zonder te werken gebruikt je eigen kosten per maand, of die van een land als begin.",
          "Er gaat niets van je geld af: elk doel wordt apart berekend.",
        ],
      },
      {
        heading: "Controleer je plan",
        id: "check",
        body: [
          "Onder het resultaat staan tot drie punten, alleen als ze van toepassing zijn. Elk met zijn bedragen. Ze zeggen wat er is, nooit wat te doen.",
          "Weinig jaren: de jaren van je plan, of een doel, minder dan 5 jaar weg, en geld dat op en neer gaat. Het telt hoeveel van de 1000 mogelijke toekomsten tot dan onder je inleg eindigen. Het verschijnt vanaf 1 op de 10. [De methode](research:wealth-lens/chequeo.md#horizonte-frente-a-riesgo).",
          "Sparen voor 10 jaar of langer: wat de rekening overhoudt in geld van vandaag, tegenover wat je inlegt. En tegenover Amerikaanse aandelen, met dezelfde bedragen: wat je misloopt, en hun grootste daling. Die daling komt uit jaarcijfers: binnen een jaar was ze misschien dieper. [De methode](research:wealth-lens/chequeo.md#ahorro-a-largo-plazo).",
        ],
      },
      {
        heading: "Landen",
        body: [
          `De tabel heeft ${facts.countries} landen: die waarvoor de officiële gegevens van de Wereldbank een prijs geven. Voor de andere wordt geen cijfer verzonnen.`,
          `Elk bedrag is waarvan een gemiddeld persoon daar per maand leeft, wonen inbegrepen. Het komt uit het gemiddelde van de huishoudenquête (${facts.surveyFrom}–${facts.surveyTo}, per land de laatste).`,
          `Dat gemiddelde wordt omgerekend naar de prijzen van ${facts.priceYear} met de prijsniveaus van de Wereldbank.`,
          "Het is een landelijk gemiddelde: steden verschillen sterk. Sommige landen meten uitgaven, andere inkomen, en wie het meest heeft trekt een gemiddelde omhoog.",
          "✓ en een jaar betekenen dat wat je geld per maand uitbetaalt het vanaf dat jaar dekt. Anders zegt de tabel wanneer je plan er is. [De methode](research:wealth-lens/coste-de-vida.md).",
        ],
      },
      {
        heading: "Stijgende prijzen in elk land",
        body: [
          "Elk land heeft een jaarlijkse prijsstijging voor de lange termijn: het doel dat zijn centrale bank publiceert, gecontroleerd in september 2026.",
          "Eurolanden gebruiken de 2% van de Europese Centrale Bank. Waar geen doel is, is het ongeveer het gemiddelde van 2015–2024.",
          `In ${facts.highInflation} stegen de prijzen in 2015–2024 met 10% per jaar of meer. Waar een doel bestaat, wordt toch het doel gebruikt.`,
        ],
      },
      {
        heading: "Test mijn plan",
        body: [
          "Je plan gaat door de jaren uit het verleden in de volgorde waarin ze gebeurden, zonder herhaling. De cijfers zijn voor hele kalenderjaren.",
          "Elke crash begint het jaar ervoor. De daling is wat de crash deed met je geld op het hoogste punt.",
          "Een daling die binnen een jaar herstelde, zie je niet in jaarcijfers. Covid in 2020 is er een van.",
        ],
      },
      {
        heading: "Wat het niet doet",
        body: [
          "Het geeft geen advies en doet geen voorspelling. Het laat belastingen en de meeste kosten weg.",
          "Het downloadt niets terwijl je het gebruikt: elk cijfer zit in de pagina, met zijn bron en jaar.",
          "Bedragen zijn in de munt die je kiest. De groei is die van elke belegging zelf, na prijsstijging: wisselkoersen tussen munten tellen niet mee.",
        ],
      },
    ],
    sourcesTitle: "Bronnen",
    sourcesIntro: "Elke bron, wat ze geeft, hoe ver haar gegevens gaan, en haar voorwaarden.",
    source: { link: "Open de bron", date: "Gegevens", terms: "Voorwaarden" },
    sources: (facts: HowItWorksFacts): SourceEntry[] => [
      {
        name: "UBS Global Investment Returns Yearbook 2025 (Dimson, Marsh en Staunton), zoals gemeld door Cambridge Judge Business School",
        what: "Jaarlijkse groei van wereldaandelen na prijsstijging, 1900–2024: 5,2%",
        url: "https://www.jbs.cam.ac.uk/2025/report-stocks-have-far-outperformed-over-the-past-125-years/",
        date: "1900 tot 2024",
        terms: "Alleen dit ene cijfer wordt gebruikt: de 5% waarmee de rekenmachine begint.",
      },
      {
        name: "Robert J. Shiller, Yale University",
        what: "Jaarlijkse groei van Amerikaanse aandelen (S&P Composite), en Amerikaanse prijzen tot 2022",
        url: "http://www.econ.yale.edu/~shiller/data.htm",
        date: "tot juni 2023",
        terms: "Openlijk gepubliceerd op zijn site; gebruikt met bronvermelding.",
      },
      {
        name: "OESO en Deutsche Bundesbank",
        what: "Rente op Duitse staatsobligaties van 10 jaar",
        url: "https://www.oecd.org/en/data/indicators/long-term-interest-rates.html",
        date: "tot december 2024",
        terms: "Gegevens van de OESO: CC BY 4.0, vrij te gebruiken met bronvermelding.",
      },
      {
        name: "Destatis, het Duitse bureau voor de statistiek",
        what: "Duitse prijzen",
        url: "https://www.destatis.de/EN/Themes/Economy/Prices/Consumer-Price-Index/_node.html",
        date: "tot december 2024",
        terms: "Datalicentie Duitsland, naamsvermelding 2.0: vrij te gebruiken met bronvermelding.",
      },
      {
        name: "US Bureau of Labor Statistics",
        what: "Amerikaanse prijzen voor 2023 en 2024",
        url: "https://www.bls.gov/cpi/",
        date: "tot december 2024",
        terms: "Publiek domein.",
      },
      {
        name: "Wereldbank, Commodity Price Data (de Pink Sheet)",
        what: "Goudprijs, gemiddelde van december van elk jaar",
        url: "https://www.worldbank.org/en/research/commodity-markets",
        date: "tot december 2024, gelezen uit een openbare kopie van de gegevens van de Wereldbank",
        terms: "CC BY 4.0: vrij te gebruiken met bronvermelding.",
      },
      {
        name: "Wereldbank, Poverty and Inequality Platform en World Development Indicators",
        what: "Waarvan een gemiddeld persoon leeft (huishoudenquêtes), prijsniveaus (ICP 2021) en de prijsstijging van elk jaar",
        url: "https://data.worldbank.org/indicator/SI.SPR.PCAP",
        date: `enquêtes tot ${facts.surveyTo}, prijzen ${facts.priceYear}${facts.provisional ? ". Voorlopig: gelezen uit een openbare kopie van de gegevens van de Wereldbank, tot de jaarlijkse download" : ""}`,
        terms: "CC BY 4.0: vrij te gebruiken met bronvermelding.",
      },
      {
        name: "Centrale banken",
        what: "Hun doelen voor de prijsstijging",
        url: "https://www.bis.org/cbanks.htm",
        date: "gecontroleerd in september 2026",
        terms: "Openbare informatie.",
      },
      {
        name: "Unicode CLDR",
        what: "Namen van landen in elke taal",
        url: "https://cldr.unicode.org",
        date: "zoals ingebouwd in Node.js",
        terms: "Unicode-licentie: vrij te gebruiken met bronvermelding.",
      },
    ],
    licensesTitle: "Licenties van de gegevens",
    licenses: [
      "De meeste bronnen laten iedereen hun gegevens hergebruiken met bronvermelding: de Wereldbank, de OESO, Destatis, het US Bureau of Labor Statistics en Unicode.",
      "Robert Shiller publiceert zijn gegevens openlijk op zijn site; ze worden gebruikt met bronvermelding. Van UBS wordt maar één gepubliceerd cijfer aangehaald: 5,2%.",
      "Horalis Groei zegt altijd waar een cijfer vandaan komt en uit welk jaar.",
      "De methode en de bronnen zijn openbaar. De code is van Horalis. De gegevens houden de rechten van hun eigenaars.",
    ],
  },
  privacy: {
    title: nl.site.footer.privacy,
    updated: "Bijgewerkt op 7 oktober 2026.",
    sections: [
      { heading: "In het kort", body: ["**Niets wat je typt wordt bewaard of verstuurd.** Geen cookies. Geen tracking."] },
      {
        heading: "Je getallen",
        body: [
          "Wat je typt blijft op deze pagina, in het geheugen van je browser. Sluit of herlaad het tabblad en het is weg.",
          "Horalis Groei heeft geen accounts, geen database en geen eigen server. Je getallen verlaten je apparaat nooit.",
          "**Mijn gegevens downloaden** bewaart een bestand op je apparaat. **Mijn gegevens laden** leest dat bestand op je apparaat. Er wordt niets geüpload.",
        ],
      },
      {
        heading: "Cookies en opslag",
        body: [
          "Horalis Groei gebruikt geen cookies. Daarom is er geen cookiemelding.",
          "Het onthoudt één ding, alleen als je het kiest: licht of donker.",
          "Die keuze blijft in de sessieopslag van dit tabblad. Als je het tabblad sluit, wordt ze gewist.",
          "Ze wordt nooit verstuurd. Kies je “Automatisch”, dan wordt ze meteen gewist.",
          "De eerste keer komt de taal uit de instellingen van je browser. Er wordt niets bewaard om die te onthouden.",
          "Een oudere versie bewaarde gegevens in de browser. Als Horalis Groei ze vindt, biedt het aan ze één keer te laden, en wist ze daarna.",
        ],
      },
      {
        heading: "Cijfers",
        body: ["Elk cijfer zit in de pagina wanneer die wordt gebouwd. Je bezoek downloadt niets van iemand anders."],
      },
      {
        heading: "Hosting",
        body: [
          "De site wordt gehost door Vercel. Om de pagina's te leveren en veilig te houden, kunnen de servers van Vercel technische gegevens over elk bezoek vastleggen.",
          "Dat kan je IP-adres zijn, de gevraagde pagina, het tijdstip en je browser. Horalis Groei ziet en gebruikt die gegevens niet.",
          "Zie het [privacybeleid van Vercel](https://vercel.com/legal/privacy-policy).",
        ],
      },
      { heading: "Vragen", body: ["Schrijf naar [email](email)."] },
    ] as ProseSection[],
  },
  terms: {
    title: nl.site.footer.terms,
    updated: "Bijgewerkt op 1 oktober 2026.",
    sections: [
      {
        heading: "Geen financieel advies",
        body: [
          "Horalis Groei laat zien wat getallen doen. Het vertelt je niet wat te kopen, te verkopen of te doen.",
          "Het kent je hele situatie niet: je belastingen, schulden, gezin of plannen. Praat voor een grote beslissing met een erkende adviseur.",
        ],
      },
      {
        heading: "Geen garantie",
        body: [
          "Elk cijfer is een schatting. Groei komt uit het verleden, en het verleden belooft niets over de toekomst.",
          "Kosten van levensonderhoud en prijzen zijn ruwe schattingen en kunnen verouderd zijn. Horalis Groei kan fouten bevatten.",
          "Het wordt geleverd zoals het is, zonder enige garantie.",
        ],
      },
      {
        heading: "Eigen risico",
        body: ["Je beslist zelf wat je met je geld doet, en je gebruikt Horalis Groei op eigen risico. De makers zijn niet aansprakelijk voor verliezen of beslissingen op basis ervan."],
      },
      {
        heading: "Gratis te gebruiken",
        body: [
          "Iedereen kan Horalis Groei gratis gebruiken, op de website.",
          "De code is van Horalis. Zonder schriftelijke toestemming mag ze niet worden gekopieerd, gewijzigd, gedeeld of gebruikt om andere producten te maken.",
          "De namen en logo's van Horalis en zijn hulpmiddelen zijn merken. Ze mogen niet worden gebruikt zonder schriftelijke toestemming.",
          "De gegevens zijn van hun bronnen, die hun rechten houden. [Hoe het werkt](/how-it-works) noemt ze allemaal.",
        ],
      },
      { heading: "Wijzigingen", body: ["Deze voorwaarden kunnen veranderen. De datum bovenaan zegt wanneer ze voor het laatst zijn gewijzigd."] },
    ] as ProseSection[],
  },
  notFound: {
    title: "Deze pagina bestaat niet",
    text: "Misschien zit er een typefout in het adres, of is de pagina verhuisd.",
    home: "Naar Horalis Groei",
  },
};
