/**
 * The page's script, in the browser: as the amount or the countries
 * change, it redraws the result and the two lists. The countries come
 * inside the page (#countries, written by the build); nothing is
 * downloaded, stored or sent. On arrival it starts from the country the
 * browser's language names (es-MX → Mexico), worked out on the device.
 * The build turns it and its imports into plain JavaScript modules
 * (seed-kit's browser.ts).
 */

import { formatsFor, parseNumber } from "../../../packages/seed-kit/src/format.ts";
import { DEFAULT_LOCALE, isLocale } from "../../../packages/seed-kit/src/locales.ts";
import { byCode, startingChoice, type Country } from "./calc.ts";
import { WORDS } from "./i18n/index.ts";
import { listsHtml, resultHtml } from "./view.ts";

const form = document.querySelector<HTMLFormElement>("#calc");
const result = document.querySelector<HTMLElement>("#result");
const lists = document.querySelector<HTMLElement>("#lists");
const label = document.querySelector<HTMLElement>("label[for=amount]");
const data = document.querySelector<HTMLScriptElement>("#countries");
const lang = document.documentElement.lang;
const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

if (form && result && lists && label && data) {
  const countries = JSON.parse(data.textContent ?? "[]") as Country[];
  const formats = formatsFor(locale);
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  const update = () => {
    const choice = { amount: parseNumber(field("amount").value, formats.decimalSeparator), from: field("from").value, to: field("to").value };
    label.textContent = WORDS[locale].home.amount(byCode(choice.from, countries)?.currency ?? "");
    result.innerHTML = resultHtml(choice, countries, locale).value;
    lists.innerHTML = listsHtml(choice, countries, locale).value;
  };
  // Untouched as built: start from where the browser's language says.
  const built = { amount: field("amount").value, from: field("from").value, to: field("to").value };
  const start = startingChoice(navigator.language, countries, built);
  if (start.from !== built.from && Number.isFinite(start.amount)) {
    field("amount").value = formats.grouped(start.amount);
    field("from").value = start.from;
    field("to").value = start.to;
    update();
  }
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
  });
}
