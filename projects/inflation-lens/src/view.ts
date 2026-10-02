/**
 * The result and the timeline as HTML, in the page's language: the build
 * writes them into the page (so they show before anyone types, even
 * without scripts) and the browser redraws them as the amount, year,
 * place or direction change. Same code in both places; it gets the
 * series, it does not load them.
 */

import { formatsFor } from "../../../packages/seed-kit/src/format.ts";
import { escape, html, raw, type Html } from "../../../packages/seed-kit/src/html.ts";
import type { Locale } from "../../../packages/seed-kit/src/locales.ts";
import { lastYear, rise, worthThen, worthToday, type Series } from "./calc.ts";
import { WORDS } from "./i18n.ts";

export interface Choice {
  amount: number;
  year: number;
  place: string;
  /** "today": from that year's euros to today's; "then": the other way. */
  direction: "today" | "then";
}

/** "≈ €136": every amount here is an estimate (the rates have one decimal), in whole euros. */
function about(amount: number, locale: Locale): string {
  return `≈\u00a0${formatsFor(locale).eur(amount)}`;
}

/** The answer, how much prices rose, and the sentence for 100 euros. */
export function resultHtml(choice: Choice, all: readonly Series[], locale: Locale): Html {
  const words = WORDS[locale].home;
  const series = all.find((entry) => entry.code === choice.place);
  const value = series && (choice.direction === "today" ? worthToday(choice.amount, choice.year, series) : worthThen(choice.amount, choice.year, series));
  const change = series ? rise(choice.year, series) : null;
  const hundred = series ? worthThen(100, choice.year, series) : null;
  if (!series || value === null || value === undefined || change === null || hundred === null) return html`<p class="sk-sentence">${words.invalid}</p>`;
  const formats = formatsFor(locale);
  const today = String(lastYear(series));
  const year = String(choice.year);
  const amount = formats.money(choice.amount, "EUR", { decimals: Number.isInteger(choice.amount) ? 0 : 2 });
  const sentence =
    choice.direction === "today"
      ? words.worthToday(amount, year, series.sentence, about(value, locale), today)
      : words.worthThen(amount, today, year, series.sentence, about(value, locale));
  return html`<p class="sk-big">${about(value, locale)}</p>
<p class="sk-sentence">${sentence}</p>
<p class="sk-muted">${change >= 0 ? words.rose(formats.percent(change), year) : words.fell(formats.percent(-change), year)}</p>
<p class="key">${words.key(formats.eur(100), year, about(hundred, locale))}</p>`;
}

const WIDTH = 640;
const HEIGHT = 160;

/** A simple timeline: one bar per year, how much prices rose; the years since the chosen one stand out. */
export function timelineHtml(choice: Choice, all: readonly Series[], locale: Locale): Html {
  const words = WORDS[locale].home;
  const series = all.find((entry) => entry.code === choice.place);
  if (!series) return html``;
  const formats = formatsFor(locale);
  const years = series.rates.map((rate, index) => ({ year: series.from + index, rate }));
  const high = Math.max(1, ...years.map(({ rate }) => rate));
  const low = Math.min(0, ...years.map(({ rate }) => rate));
  const scale = HEIGHT / (high - low);
  const zero = high * scale;
  const step = WIDTH / years.length;
  const bar = Math.max(2, step * 0.7);
  const bars = years
    .map(({ year, rate }, index) => {
      const x = index * step + (step - bar) / 2;
      const top = rate >= 0 ? zero - rate * scale : zero;
      const height = Math.max(1, Math.abs(rate) * scale);
      return `<rect class="${year > choice.year ? "in" : "out"}" x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bar.toFixed(1)}" height="${height.toFixed(1)}"><title>${year}: ${escape(formats.percent(rate / 100))}</title></rect>`;
    })
    .join("");
  const first = years[0].year;
  const last = years[years.length - 1].year;
  // The bars stretch to the card; the years under them are text, so they keep their size.
  const svg = `<svg class="timeline" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="none" role="img" aria-label="${escape(words.timelineLabel(series.sentence, String(first), String(last)))}"><line x1="0" x2="${WIDTH}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}" vector-effect="non-scaling-stroke"/>${bars}</svg>`;
  const at = (year: number) => `${(((year - first + 0.5) / years.length) * 100).toFixed(1)}%`;
  const middle = choice.year > first && choice.year < last - 1 ? html`<span class="mid" style="left:${at(choice.year + 0.5)}">${choice.year}</span>` : "";
  return html`<h2 id="timeline-title">${words.timeline}</h2>
<p class="sk-muted legend"><span class="swatch" aria-hidden="true"></span> ${words.since(String(choice.year))}</p>
${raw(svg)}
<p class="axis" aria-hidden="true"><span>${first}</span>${middle}<span>${last}</span></p>
<details>
<summary>${words.showYears}</summary>
<table><thead><tr><th scope="col">${words.tableYear}</th><th scope="col">${words.tableRate}</th></tr></thead>
<tbody>${years.map(({ year, rate }) => html`<tr${year > choice.year ? raw(' class="in"') : ""}><th scope="row">${year}</th><td>${formats.percent(rate / 100)}</td></tr>`)}</tbody></table>
</details>`;
}
