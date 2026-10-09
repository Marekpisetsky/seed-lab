/**
 * The result as HTML, in the page's language: the build writes it into
 * the page (so it shows before anyone types, even without scripts) and the
 * browser redraws it as the amount or the countries change. Same code in
 * both places; it gets the countries, it does not load them.
 */

import { formatsFor, roundMoney } from "../../../packages/seed-kit/src/format.ts";
import { html, type Html } from "../../../packages/seed-kit/src/html.ts";
import type { Locale } from "../../../packages/seed-kit/src/locales.ts";
import { byCode, equivalent, exchangeRate, extremes, type Country, type Ranked } from "./calc.ts";
import { WORDS } from "./i18n/index.ts";

export interface Choice {
  amount: number;
  from: string;
  to: string;
}

/** Whose way numbers are written: the reader's region ("MX"), or "" for the page language's own (the page as built). */
export type Region = string;

/** Amounts in a country's currency, written the page's language's way, in the reader's region. */
function formatsIn(country: Country, locale: Locale, region: Region) {
  return formatsFor(locale, { country: region, currency: country.currency });
}

/** "≈ €950": every amount here is an estimate, rounded the way the data allow. */
function about(amount: number, country: Country, locale: Locale, region: Region): string {
  return `≈\u00a0${formatsIn(country, locale, region).cur(roundMoney(amount))}`;
}

/** "€1 = S/ 4.04": the rate between two currencies, from the one worth more, with the figures that matter. */
export function ratePair(from: Country, to: Country, locale: Locale, region: Region = ""): string {
  const rate = exchangeRate(from, to);
  const [one, other, value] = rate >= 1 ? [from, to, rate] : [to, from, 1 / rate];
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${formatsIn(one, locale, region).money(1, one.currency, { decimals: 0 })} = ${formatsIn(other, locale, region).money(value, other.currency, { decimals })}`;
}

/** The sentence: what you would need there to live the same, and the rates it used. */
export function resultHtml(choice: Choice, countries: readonly Country[], locale: Locale, region: Region = ""): Html {
  const words = WORDS[locale].home;
  const from = byCode(choice.from, countries);
  const to = byCode(choice.to, countries);
  const need = from && to ? equivalent(choice.amount, from, to) : null;
  if (!from || !to || !need) return html`<p class="sk-sentence">${words.invalid}</p>`;
  const inDollars = [from, to].filter((country) => country.currency === "USD" && country.ownCurrency !== "USD");
  return html`<p class="sk-big">${about(need, to, locale, region)}</p>
<p class="sk-sentence">${words.sentence(formatsIn(from, locale, region).cur(choice.amount), from.sentence, to.sentence, about(need, to, locale, region))}</p>
${from.currency === to.currency ? "" : html`<p class="sk-small">${words.rate(String(to.rateYear), ratePair(from, to, locale, region))}</p>`}
${inDollars.map((country) => html`<p class="sk-small">${words.inDollars(country.name, String(country.rateYear))}</p>`)}`;
}

function rows(ranked: readonly Ranked[], locale: Locale, region: Region): Html {
  const words = WORDS[locale].home;
  const times = (value: number) => words.times(formatsFor(locale, { country: region }).fixed(value, 1));
  return html`${ranked.map(
    ({ country, reach }) =>
      html`<tr><th scope="row">${country.name}</th><td>${times(reach)}</td></tr>`,
  )}`;
}

/** Where the amount goes furthest and least far. */
export function listsHtml(choice: Choice, countries: readonly Country[], locale: Locale, region: Region = ""): Html {
  const words = WORDS[locale].home;
  const from = byCode(choice.from, countries);
  if (!from) return html``;
  const { furthest, least } = extremes(from, countries);
  const amount = Number.isFinite(choice.amount) && choice.amount > 0 ? formatsIn(from, locale, region).cur(choice.amount) : words.yourMoney;
  const table = (title: string, ranked: readonly Ranked[], id: string) => html`<section class="sk-card rank" aria-labelledby="${id}">
<h2 id="${id}">${title}</h2>
<table>
<thead><tr><th scope="col">${words.country}</th><th scope="col">${words.goesFurther}</th></tr></thead>
<tbody>${rows(ranked, locale, region)}</tbody>
</table>
</section>`;
  return html`<p class="sk-muted lists-intro">${words.listsIntro(from.sentence)}</p>
<div class="lists">
${table(words.furthest(amount), furthest, "furthest")}
${table(words.least(amount), least, "least")}
</div>`;
}
