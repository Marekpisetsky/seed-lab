/**
 * The words seed-kit itself writes, in Dutch: the header and footer of
 * every Horalis page (chrome.ts) and the privacy and terms page of the
 * static tools (legal.ts).
 *
 * PENDING REVIEW BY A NATIVE SPEAKER ("pendiente de revisión por un
 * nativo"): written without one. Dutch pages are built but hidden from the
 * language switch, not linked and not indexed until Marek approves them
 * (locales.ts, `pendingReview`).
 */

import { HOSTING } from "../hosting.ts";
import type { LegalPage } from "../legal-types.ts";
import type { KitWords } from "./index.ts";

export const chrome = {
  skip: "Naar de inhoud",
  pages: "Pagina's",
  language: "Taal",
  launcher: "Horalis-tools",
  hub: "Horalis",
  hubNote: "Alle Horalis-tools",
  tools: "Tools",
  here: "Je bent hier",
  more: "Meer",
  theme: "Weergave",
  themes: { auto: "Automatisch", light: "Licht", dark: "Donker" },
  themeAuto: "Zoals je apparaat",
  themeNote: "Alleen onthouden in dit tabblad.",
  partOf: "Onderdeel van Horalis",
  copyright: "© 2026 Horalis. Gratis te gebruiken.",
  reviewNote: "Deze vertaling wacht nog op controle door een moedertaalspreker.",
} satisfies KitWords["chrome"];

/** Why a higher return does not raise the withdrawal rate the data back as much: one line any tool can use (withdrawal-rate.ts). */
export const withdrawal = {
  why: "Meer rendement brengt meestal grotere dalingen. Een daling vroeg in je pensioen dwingt je goedkoop te verkopen. Daarom stijgt het veilige percentage niet even hard.",
} satisfies KitWords["withdrawal"];

export const legal = (name: string): LegalPage => ({
  title: "Privacy en voorwaarden",
  description: `${name} bewaart niets van wat je typt en verstuurt niets. Geen cookies. Wat de hosting ziet, en de voorwaarden.`,
  updated: "Bijgewerkt op 3 oktober 2026.",
  sections: [
    { heading: "In het kort", body: ["**Niets van wat je typt wordt bewaard of verstuurd.** Geen cookies. Geen tracking."] },
    {
      heading: "Je getallen",
      body: [
        "Wat je typt, blijft op deze pagina, in het geheugen van je browser. Sluit of herlaad het tabblad en het is weg.",
        `${name} heeft geen accounts, geen database en geen eigen server. Je getallen verlaten je apparaat nooit.`,
      ],
    },
    {
      heading: "Cookies en opslag",
      body: [
        `${name} gebruikt geen cookies. Daarom is er geen cookiemelding.`,
        "Het onthoudt één ding, en alleen als je het kiest: licht of donker.",
        "Die keuze blijft in de sessieopslag van dit tabblad. Als je het tabblad sluit, is ze weg.",
        "Ze wordt nooit verstuurd. Kies je “Automatisch”, dan wordt ze meteen gewist.",
        "De eerste keer komt de taal uit de instellingen van je browser. Er wordt niets bewaard om die te onthouden.",
      ],
    },
    {
      heading: "Hosting",
      body: [
        `De site wordt gehost door ${HOSTING.name}. Om de pagina's te leveren en te beveiligen, kunnen de servers technische gegevens van elk bezoek vastleggen.`,
        `Dat kan je IP-adres zijn, de gevraagde pagina, het tijdstip en je browser. ${name} ziet en gebruikt die gegevens niet.`,
        `Zie [het privacybeleid van ${HOSTING.name}](${HOSTING.policy}).`,
      ],
    },
    {
      heading: "Geen garantie",
      body: [
        "Elk getal is een schatting op basis van openbare bronnen. Het kan grof, verouderd of fout zijn.",
        `${name} kent je hele situatie niet. Het geeft je geen advies.`,
        "Het wordt aangeboden zoals het is, zonder enige garantie. Je gebruikt het op eigen risico.",
      ],
    },
    {
      heading: "Gratis te gebruiken",
      body: [
        `Iedereen kan ${name} gratis gebruiken, op de website.`,
        "De code is van Horalis. Zonder schriftelijke toestemming mag ze niet worden gekopieerd, gewijzigd, gedeeld of gebruikt om andere producten te maken.",
        "De gegevens zijn van hun bronnen, die hun rechten houden. Elke bron staat naast haar getallen.",
      ],
    },
    { heading: "Vragen", body: [`${name} is onderdeel van [Horalis](hub). Hoe je ons bereikt, staat op [de pagina Over](hub-about).`] },
  ],
});
