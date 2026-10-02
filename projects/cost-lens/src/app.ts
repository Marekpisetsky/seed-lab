/**
 * The page's script, in the browser: as numbers are typed, it redraws the
 * result. It only reads the form and writes the result: nothing is
 * stored, nothing is sent. The build turns it and its imports into plain
 * JavaScript modules (seed-kit's browser.ts).
 */

import { formatsFor, parseNumber } from "../../../packages/seed-kit/src/format.ts";
import { DEFAULT_LOCALE, isLocale } from "../../../packages/seed-kit/src/locales.ts";
import { resultHtml } from "./view.ts";

const form = document.querySelector<HTMLFormElement>("#calc");
const output = document.querySelector<HTMLElement>("#result");
const lang = document.documentElement.lang;
const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

if (form && output) {
  const decimal = formatsFor(locale).decimalSeparator;
  const read = (name: string) => parseNumber((form.elements.namedItem(name) as HTMLInputElement).value, decimal);
  const update = () => {
    output.innerHTML = resultHtml(read("before"), read("after"), locale).value;
  };
  form.addEventListener("input", update);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update();
  });
}
