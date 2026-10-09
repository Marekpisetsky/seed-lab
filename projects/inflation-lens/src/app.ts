/**
 * The page's script, in the browser: as the amount, year, place or
 * direction change, it redraws the result and the timeline; a new place
 * brings its own years. The series come inside the page (#series, written
 * by the build); nothing is downloaded, stored or sent. It starts from
 * the country the browser's language names, if it has its data. The build turns
 * it and its imports into plain JavaScript modules (seed-kit's browser.ts).
 */

import { formatsFor, parseNumber } from "../../../packages/seed-kit/src/format.ts";
import { countryFromLanguage, readerRegion } from "../../../packages/seed-kit/src/detect.ts";
import { DEFAULT_LOCALE, isLocale } from "../../../packages/seed-kit/src/locales.ts";
import { yearOptions, type Series } from "./calc.ts";
import { WORDS } from "./i18n/index.ts";
import { resultHtml, timelineHtml, type Choice } from "./view.ts";

const form = document.querySelector<HTMLFormElement>("#calc");
const result = document.querySelector<HTMLElement>("#result");
const timeline = document.querySelector<HTMLElement>("#timeline");
const data = document.querySelector<HTMLScriptElement>("#series");
const lang = document.documentElement.lang;
const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

if (form && result && timeline && data) {
  const all = JSON.parse(data.textContent ?? "[]") as Series[];
  // Numbers the reader's way (es-MX: 1,234.5), worked out on the device; the page was built the language's own way.
  const region = readerRegion(locale, navigator.language);
  const decimal = formatsFor(locale, { country: region }).decimalSeparator;
  const amount = form.elements.namedItem("amount") as HTMLInputElement;
  const year = form.elements.namedItem("year") as HTMLSelectElement;
  const place = form.elements.namedItem("place") as HTMLSelectElement;
  const label = form.querySelector<HTMLLabelElement>("label[for=amount]");
  /** A new place has its own years: keep the chosen one if it has it, else its nearest. */
  const fillYears = (series: Series) => {
    const options = yearOptions(series);
    const wanted = Number(year.value);
    const keep = options.includes(wanted) ? wanted : options.reduce((best, option) => (Math.abs(option - wanted) < Math.abs(best - wanted) ? option : best), options[0]);
    year.replaceChildren(...options.map((option) => new Option(String(option), String(option), false, option === keep)));
  };
  const update = (event?: Event) => {
    const series = all.find((entry) => entry.code === place.value);
    if (series && event?.target === place) fillYears(series);
    if (series && label) label.textContent = WORDS[locale].home.amount(series.currency);
    const direction = (form.elements.namedItem("direction") as RadioNodeList).value === "then" ? "then" : "today";
    const choice: Choice = { amount: parseNumber(amount.value, decimal), year: Number(year.value), place: place.value, direction };
    result.innerHTML = resultHtml(choice, all, locale, region).value;
    timeline.innerHTML = timelineHtml(choice, all, locale, region).value;
  };
  // As built, the euro area; a browser whose language names a country with data starts there (worked out on the device).
  const built = parseNumber(amount.value, formatsFor(locale).decimalSeparator);
  if (region !== "" && Number.isFinite(built)) amount.value = formatsFor(locale, { country: region }).grouped(built);
  const start = countryFromLanguage(navigator.language, all.map((series) => series.code), place.value);
  const moved = start !== place.value;
  if (moved) place.value = start;
  if (moved || region !== "") update(moved ? ({ target: place } as unknown as Event) : undefined);
  form.addEventListener("input", update);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
  });
}
