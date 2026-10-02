/**
 * The page's script, in the browser: as the amount or the countries
 * change, it redraws the result and the two lists. The countries come
 * inside the page (#countries, written by the build); nothing is
 * downloaded, stored or sent. The build turns it and its imports into
 * plain JavaScript modules (seed-kit's browser.ts).
 */

import { formatsFor, parseNumber } from "../../../packages/seed-kit/src/format.ts";
import { DEFAULT_LOCALE, isLocale } from "../../../packages/seed-kit/src/locales.ts";
import type { Country } from "./calc.ts";
import { listsHtml, resultHtml } from "./view.ts";

const form = document.querySelector<HTMLFormElement>("#calc");
const result = document.querySelector<HTMLElement>("#result");
const lists = document.querySelector<HTMLElement>("#lists");
const data = document.querySelector<HTMLScriptElement>("#countries");
const lang = document.documentElement.lang;
const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

if (form && result && lists && data) {
  const countries = JSON.parse(data.textContent ?? "[]") as Country[];
  const decimal = formatsFor(locale).decimalSeparator;
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  const update = () => {
    const choice = { amount: parseNumber(field("amount").value, decimal), from: field("from").value, to: field("to").value };
    result.innerHTML = resultHtml(choice, countries, locale).value;
    lists.innerHTML = listsHtml(choice, countries, locale).value;
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
  });
}
