/**
 * The page's script, in the browser: as the amount or the countries
 * change, it redraws the result and the two lists. The countries come
 * inside the page (#countries, written by the build); nothing is
 * downloaded, stored or sent. On arrival it starts from the country the
 * browser's language names (es-MX → Mexico) and writes numbers the
 * reader's way, worked out on the device. The build turns it and its
 * imports into plain JavaScript modules (seed-kit's browser.ts).
 */

import { readerRegion } from "../../../packages/seed-kit/src/detect.ts";
import { formatsFor, parseNumber } from "../../../packages/seed-kit/src/format.ts";
import { DEFAULT_LOCALE, isLocale } from "../../../packages/seed-kit/src/locales.ts";
import { byCode, monthlyCost, sameMoney, startingChoice, type Country } from "./calc.ts";
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
  const region = readerRegion(locale, navigator.language);
  const formats = formatsFor(locale, { country: region });
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  const amountField = field("amount");
  // The page was built writing numbers the language's own way: read them that way once.
  const built = { amount: parseNumber(amountField.value, formatsFor(locale).decimalSeparator), from: field("from").value, to: field("to").value };
  let typed = false;
  let from = built.from;
  const update = () => {
    const choice = { amount: parseNumber(amountField.value, formats.decimalSeparator), from: field("from").value, to: field("to").value };
    label.textContent = WORDS[locale].home.amount(byCode(choice.from, countries)?.currency ?? "");
    result.innerHTML = resultHtml(choice, countries, locale, region).value;
    lists.innerHTML = listsHtml(choice, countries, locale, region).value;
  };
  /** Where you live changed: the same money in its currency, or, untouched, what living there costs. */
  const moved = () => {
    const before = byCode(from, countries);
    const now = byCode(field("from").value, countries);
    from = field("from").value;
    if (!before || !now || before.currency === now.currency) return;
    const amount = parseNumber(amountField.value, formats.decimalSeparator);
    const next = typed && Number.isFinite(amount) ? sameMoney(amount, before, now) : monthlyCost(now);
    amountField.value = formats.grouped(Math.round(next));
  };
  // Untouched as built: start from where the browser's language says, written the reader's way.
  const start = startingChoice(navigator.language, countries, built);
  if (start.from !== built.from && Number.isFinite(start.amount)) {
    field("from").value = start.from;
    field("to").value = start.to;
    from = start.from;
    amountField.value = formats.grouped(start.amount);
  } else if (Number.isFinite(built.amount)) {
    amountField.value = formats.grouped(built.amount);
  }
  if (start.from !== built.from || region !== "") update();
  amountField.addEventListener("input", () => (typed = true));
  form.addEventListener("input", (event) => {
    if (event.target === field("from")) moved();
    update();
  });
  form.addEventListener("change", (event) => {
    if (event.target === field("from") && field("from").value !== from) moved();
    update();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
  });
}
