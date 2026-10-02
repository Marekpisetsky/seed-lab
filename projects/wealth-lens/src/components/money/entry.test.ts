import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/i18n";
import { calculationFor } from "@/hooks/use-calculation";
import { getI18n, type I18n } from "@/i18n";
import { countryName } from "@/i18n/countries";
import type { Locale } from "@/i18n/locales";
import { INITIAL_STATE, type AppState } from "@/lib/app-store";
import { dearestCovered } from "@/lib/calculator";
import { parseIsoDate } from "@/lib/dates";
import { indexRate } from "@/lib/examples";
import { toNominal } from "@/lib/investment";
import { bandsFor } from "@/lib/projections";
import { STANDARD_ASSUMPTIONS } from "@/lib/types";
import { EXAMPLE_PLAN } from "@/lib/validation";
import { CalculatorCard, MoreOptionsLink } from "./calculator-card";
import { firstResult, TOTAL_ID } from "./first-result";
import { GoalsSection } from "./goals-section";
import { PERIODS, shownYears } from "./growth-chart";
import { MoneyModule } from "./money-module";
import { Results } from "./results";
import { WhereDetails } from "./where-details";

// The page reads the app's state through this hook: each test gives its own.
const app = vi.hoisted(() => ({ state: null as AppState | null }));
vi.mock("@/hooks/use-app", () => ({ useAppState: () => app.state }));

const today = parseIsoDate("2026-09-30");
const filled: AppState = { ...INITIAL_STATE, plan: EXAMPLE_PLAN };

const Provider = I18nProvider as React.FC<{ i18n: I18n; children?: React.ReactNode }>;

function render(locale: Locale, state: AppState, element: React.ReactElement): string {
  app.state = state;
  return renderToStaticMarkup(createElement(Provider, { i18n: getI18n(locale) }, element));
}

const decode = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
/** The markup as words, the way a screen reader would meet them (no-break spaces kept). */
const text = (html: string) => decode(html.replace(/<[^>]+>/g, " ")).replace(/[ \t\r\n]+/g, " ");
const count = (html: string, part: string) => decode(html).split(part).length - 1;
/** The folded cards: each a heading that is a button. */
/** A "?" button, in this language. */
const helpButtons = (html: string, locale: Locale) => count(html, `aria-label="${getI18n(locale).m.help.button("\0").split("\0")[0]}`);
const FOLDED = '<h3><button type="button" aria-expanded="false"';

afterEach(() => {
  app.state = null;
});

describe.each(["en", "es"] as const)("the first screen (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  const html = render(locale, INITIAL_STATE, createElement(MoneyModule));
  const steps = html.slice(html.indexOf("<ol"), html.indexOf("</ol>")).split("<li").slice(1).map((step) => `<li${step}`);

  it("asks four short questions in numbered steps, in order, each with one field", () => {
    const questions = [m.calculator.steps.have, m.calculator.steps.monthly, m.calculator.steps.growth, m.calculator.steps.years];
    expect(steps).toHaveLength(4);
    steps.forEach((step, index) => {
      expect(text(step).trim().startsWith(`${index + 1} ${questions[index]}`)).toBe(true);
      expect(count(step, "<input")).toBe(1);
      // The question names its field.
      const id = step.match(/<input[^>]*\sid="([^"]+)"/)?.[1];
      expect(decode(step)).toContain(`<label for="${id}"`);
    });
  });

  it("has no help lines but step 3's: no “You can change it”, nothing said twice", () => {
    for (const index of [0, 1, 3]) expect(steps[index]).not.toMatch(/<p[\s>]/);
    const words = text(html);
    expect(words).not.toMatch(/You can change it|Puedes cambiarlo/);
    expect(words.split(m.calculator.steps.growth).length - 1).toBe(1);
  });

  it("starts step 3 at 5, with one line on what it is, and the same before inflation, small", () => {
    const growth = steps[2];
    expect(growth.match(/<input[^>]*\svalue="([^"]*)"/)?.[1]).toBe("5");
    expect(text(growth)).toContain(m.growth.standard);
    expect(text(growth)).toContain(m.growth.before(f.rate(toNominal(0.05, 0.02))));
    // Fixed heights: the line before inflation one line, the line on what it is two, whatever the language.
    expect(growth).toContain("h-5 truncate");
    expect(growth).toContain("line-clamp-2 h-10");
  });

  it("gives five examples under step 3 that fill the field with one tap, none marked at 5 %", () => {
    const examples = [...decode(steps[2]).matchAll(/<button type="button" aria-pressed="(true|false)" aria-label="([^"]+)"/g)];
    expect(examples.map((example) => example[2].split(",")[0])).toEqual(Object.values(m.growth.examples));
    expect(examples.every((example) => example[1] === "false")).toBe(true);
    expect(text(steps[2])).toContain(m.growth.examplesLabel);
    // No chips, no list to open, no switch.
    expect(html).not.toContain('role="radio"');
    expect(html).not.toContain("<select");
    expect(html).not.toContain('role="switch"');
  });

  it("starts with only the years and the growth filled in, and examples that read as examples", () => {
    const values = [...html.matchAll(/<input[^>]*\svalue="([^"]*)"/g)].map((match) => match[1]);
    expect(values).toEqual(["", "", "5", "20"]);
    const examples = [...html.matchAll(/placeholder="([^"]*)"[^>]*value=""/g)].map((match) => match[1]);
    expect(examples).toEqual(locale === "en" ? ["e.g. 1,000", "e.g. 200"] : ["p. ej. 1.000", "p. ej. 200"]);
    expect(html).toContain("placeholder:italic");
  });

  it("uses the number keyboard and goes on to the next step with Enter", () => {
    const inputs = [...html.matchAll(/<input[^>]*>/g)].map((match) => match[0]);
    expect(inputs.every((input) => input.includes('inputMode="decimal"'))).toBe(true);
    expect(inputs.map((input) => input.match(/enterKeyHint="(\w+)"/)?.[1])).toEqual(["next", "next", "next", "next"]);
  });

  it("keeps the columns at fixed widths, the questions on one line", () => {
    for (const step of steps) {
      expect(step).toContain("md:grid-cols-[1.75rem_16rem_22rem]");
      expect(step).toContain("whitespace-nowrap");
    }
  });

  it("ends the card with “See my result”, the one thing that stands out, not yet working", () => {
    const card = decode(html.slice(html.indexOf("<section"), html.indexOf("</section>")));
    expect(count(card, "bg-accent ")).toBe(1);
    const button = card.match(/<button[^>]*aria-disabled="true"[^>]*>([^<]*)/);
    expect(button?.[1]).toBe(m.calculator.see);
    expect(button?.[0]).not.toMatch(/\sdisabled=/);
    // Why, for a screen reader; the eye sees it greyed, and a press goes to the empty field.
    const why = button?.[0].match(/aria-describedby="([^"]+)"/)?.[1];
    expect(card).toContain(`<span id="${why}" class="sr-only">${m.calculator.calm}</span>`);
    expect(card.lastIndexOf("</ol>")).toBeLessThan(card.indexOf(m.calculator.see));
  });

  it("puts More options out of the card: a quiet link under it, its panel closed", () => {
    const card = html.slice(html.indexOf("<section"), html.indexOf("</section>"));
    expect(card).not.toContain(m.more.title);
    const after = decode(html.slice(html.indexOf("</section>")));
    expect(after).toMatch(new RegExp(`<button type="button" aria-expanded="false"[^>]*>${m.more.title}`));
    for (const inside of [m.more.upsTitle, m.more.pricesTitle]) expect(text(html)).not.toContain(inside);
  });

  it("says under the form what to trust: no accounts, nothing saved, the data's years", () => {
    const trust = html.slice(html.indexOf("</section>"));
    for (const point of [m.money.trust.noAccount, m.money.trust.nothingSaved, m.money.trust.data("1988–2022")]) expect(text(trust)).toContain(point);
  });

  it("shows no result, chart, section or warning", () => {
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("bg-warning-bg");
    for (const absent of [m.result.label, m.facts.pays, m.whatIf.title, m.cards.where, m.goals.title, m.findings.title]) expect(text(html)).not.toContain(absent);
    expect(helpButtons(html, locale)).toBe(0);
  });
});

describe.each(["en", "es"] as const)("step 3 with another number (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  const card = (plan: Partial<AppState["plan"]>) => render(locale, { ...filled, plan: { ...EXAMPLE_PLAN, ...plan } }, createElement(CalculatorCard));
  const step3 = (html: string) => html.slice(html.indexOf("<ol")).split("<li")[3];

  it("marks the example a chip-chosen plan matches, and shows its growth and where it comes from", () => {
    const html = step3(card({ investment: { kind: "asset", asset: "sp500" }, assumptions: STANDARD_ASSUMPTIONS }));
    expect(html.match(/<input[^>]*\svalue="([^"]*)"/)?.[1]).toBe(locale === "en" ? "7.5" : "7,5");
    const pressed = [...decode(html).matchAll(/aria-pressed="true" aria-label="([^"]+)"/g)].map((match) => match[1]);
    expect(pressed).toEqual([m.growth.example(m.growth.examples.sp500, f.rate(indexRate("sp500")))]);
    // Where its number comes from: its own past years.
    expect(text(html)).toContain(m.invest.source.asset("S&P 500", "1988–2022"));
  });

  it("says a number of one's own is one's own", () => {
    const html = step3(card({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.06 } }));
    expect(text(html)).toContain(m.growth.yours);
    expect(decode(html)).not.toContain('aria-pressed="true"');
  });

  it("warns in the same place, the same size, when the number is beyond the best 20 years", () => {
    const html = step3(card({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.2 } }));
    expect(text(html)).toContain(m.growth.veryRare(20, f.rate(0.13)).slice(0, 10));
    expect(html).toContain("line-clamp-2 h-10");
    expect(html).toContain("text-warning-foreground");
  });

  it("marks More options Custom only when something in it changes", () => {
    const own = render(locale, { ...filled, plan: { ...EXAMPLE_PLAN, assumptions: { ...EXAMPLE_PLAN.assumptions, growth: 0.06 } } }, createElement(MoreOptionsLink));
    expect(text(own)).not.toContain(m.assumptions.custom);
    const moves = render(locale, { ...filled, plan: { ...EXAMPLE_PLAN, assumptions: { ...EXAMPLE_PLAN.assumptions, volatility: 0.1 } } }, createElement(MoreOptionsLink));
    expect(text(moves)).toContain(`${m.more.title} ${m.assumptions.custom}`);
  });
});

describe.each(["en", "es"] as const)("the result in levels (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  const bundle = calculationFor(filled, today);
  const html = render(locale, filled, createElement(Results, { bundle }));

  it("starts with what the user said, then the big number", () => {
    const said = m.result.summary(f.eur(1000), f.eur(200), m.result.investedIn.custom(f.rate(0.05)), m.units.years(20));
    expect(text(html)).toContain(said);
    expect(decode(html).indexOf(said)).toBeGreaterThan(0);
    expect(decode(html).indexOf(said)).toBeLessThan(decode(html).indexOf(`id="${TOTAL_ID}"`));
  });

  it("shows the big number, the key figures right under it, then a small chart", () => {
    expect(text(html)).toContain(f.eur(bundle.calc.result.total));
    expect(count(html, 'role="img"')).toBe(1);
    const grid = html.indexOf(`aria-label="${m.facts.label}"`);
    expect(html.indexOf(`id="${TOTAL_ID}"`)).toBeGreaterThan(0);
    expect(html.indexOf(`id="${TOTAL_ID}"`)).toBeLessThan(grid);
    expect(grid).toBeLessThan(html.indexOf('role="img"'));
  });

  it("shows six key figures, two across on a phone and three on a wide screen, each one tappable", () => {
    const grid = html.slice(html.indexOf(`aria-label="${m.facts.label}"`), html.indexOf('role="img"'));
    expect(grid).toContain("grid-cols-2 ");
    expect(grid).toContain("sm:grid-cols-3");
    const cells = [...decode(grid).matchAll(/<button type="button" aria-expanded="false" aria-controls="([^"]+)"[^>]*>(.*?)<\/button>/g)];
    expect(cells).toHaveLength(6);
    const panel = cells[0][1];
    expect(cells.every((cell) => cell[1] === panel)).toBe(true);
    expect(grid).toContain(`id="${panel}"`);
    const { result, scenario, investment, countries } = bundle.calc;
    const bands = bandsFor(investment, { start: scenario.capital, monthly: scenario.monthly, years: result.years });
    const dearest = countries.filter((row) => row.withoutHousing.covered).toSorted((a, b) => b.withoutHousing.amount - a.withoutHousing.amount)[0];
    const expected: [string, string][] = [
      [m.facts.putIn, f.eur(result.putIn)],
      [m.facts.grows, f.eur(result.growth)],
      [m.facts.pays, f.smallEur(result.income)],
      [m.facts.bad, f.eur(bands.p10[result.years])],
      [m.facts.good, f.eur(bands.p90[result.years])],
      [m.facts.lives, dearest ? countryName(dearest.code, getI18n(locale)) : m.facts.none],
    ];
    expected.forEach(([label, value], index) => {
      expect(text(cells[index][2])).toContain(label);
      expect(text(cells[index][2])).toContain(value);
    });
    // Where each comes from waits for a tap.
    expect(text(html)).not.toContain(m.help.income);
  });

  it("puts tabs over the chart, as on a stock chart: 5, 10, 20, 30 years and all, starting with all", () => {
    const tabs = decode(html).match(new RegExp(`<div role="radiogroup" aria-label="${m.chart.periods}"[^>]*>(.*?)</div>`))?.[1] ?? "";
    const options = [...tabs.matchAll(/<button([^>]*)>(.*?)<\/button>/g)];
    expect(options.map((option) => text(option[2]).trim())).toEqual([
      ...[5, 10, 20, 30].map((years) => `${years} ${m.units.years(years)}`),
      m.chart.all,
    ]);
    expect(options.map((option) => option[1].includes('aria-checked="true"'))).toEqual([false, false, false, false, true]);
    // A 20-year plan: 30 years is there, but cannot be picked.
    expect(options.map((option) => /\sdisabled=/.test(option[1]))).toEqual([false, false, false, true, false]);
    expect(html.indexOf(`aria-label="${m.chart.periods}"`)).toBeLessThan(html.indexOf('role="img"'));
  });

  it("follows with four sections, their titles always in sight, in order: What if…?, where it reaches, my goals, what you should know", () => {
    expect(html).not.toContain(FOLDED);
    const titles = [...decode(html).matchAll(/<h2 id="[^"]+" class="text-lg font-bold">([^<]*)<\/h2>/g)].map((match) => match[1]);
    expect(titles).toEqual([m.whatIf.title, m.cards.where, m.goals.title, m.findings.title]);
    expect(html.indexOf('role="img"')).toBeLessThan(html.indexOf(m.whatIf.title));
  });

  it("shows the five “What if…?” in one row, each with what it changes", () => {
    const row = decode(html).match(new RegExp(`<div role="group" aria-label="${m.whatIf.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>(.*?)</div>`))?.[1] ?? "";
    const chips = [...row.matchAll(/<button[^>]*aria-pressed="false"[^>]*>(.*?)<\/button>/g)];
    expect(chips).toHaveLength(5);
    expect(text(row)).toContain(`${m.whatIf.chips["monthly-50"]} +`);
    expect(text(html)).toContain(m.help.whatIf);
  });

  it("leaves only the long detail of what you should know behind “See more”", () => {
    const know = decode(html).slice(decode(html).indexOf(m.findings.title));
    expect(text(know)).toContain(m.cards.knowSummary);
    expect(know).toMatch(new RegExp(`<button type="button" aria-expanded="false"[^>]*>${m.cards.more}<span class="sr-only">: ${m.findings.title}</span>`));
    for (const inside of [m.findings.nothing, m.result.mix.range(20)]) expect(text(know)).not.toContain(inside);
  });

  it("keeps where each key figure comes from until it is tapped", () => {
    const words = text(html);
    for (const inside of [m.help.income, m.result.takenOut]) expect(words).not.toContain(inside);
  });

  it("keeps a single “?”, beside the big number", () => {
    expect(count(html, m.help.button(m.result.inYears(m.units.years(20))))).toBe(1);
    expect(helpButtons(html, locale)).toBe(1);
  });
});

describe.each(["en", "es"] as const)("where it reaches and my goals (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  const bundle = calculationFor(filled, today);
  const where = render(locale, filled, createElement(WhereDetails, { bundle }));

  it("shows the table of countries with seven rows, a way to see them all, and a search", () => {
    expect(text(where)).toContain(m.countryTable.title(m.result.perMonth(f.smallEur(bundle.calc.result.income))));
    const body = where.slice(where.indexOf("<tbody"), where.indexOf("</tbody>"));
    expect(count(body, '<th scope="row"')).toBe(7);
    expect(text(where)).toContain(m.countryTable.showAll(bundle.calc.countries.length));
    expect(where).toContain('type="search"');
  });

  it("keeps the things to buy behind “See more”", () => {
    expect(decode(where)).toContain(`${m.cards.more}<span class="sr-only">: ${m.things.title}</span>`);
    expect(where).not.toContain("things-title");
  });

  it("asks for a first goal, with what goals are for, without naming the place again", () => {
    const html = render(locale, filled, createElement(GoalsSection, { calc: bundle.calc, today, inCard: true }));
    expect(text(html)).toContain(m.help.goals);
    expect(text(html)).toContain(m.goals.add);
    // The section around it is already titled "My goals".
    expect(html).not.toMatch(/<section[^>]*aria-label/);
  });
});

describe.each(["en", "es"] as const)("the sentence before the big number (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  const t = m.result;
  const said = (plan: Partial<AppState["plan"]>) => {
    const state = { ...filled, plan: { ...EXAMPLE_PLAN, ...plan } };
    return text(render(locale, state, createElement(Results, { bundle: calculationFor(state, today) })));
  };
  const growing = t.investedIn.custom(f.rate(0.05));

  it("leaves out a monthly amount of zero, or money today of zero", () => {
    expect(said({ monthlyContribution: 0 })).toContain(t.summaryToday(f.eur(1000), growing, m.units.years(20)));
    expect(said({ invested: 0 })).toContain(t.summaryMonthly(f.eur(200), growing, m.units.years(20)));
  });

  it("names where the money goes: a chip's index, a mix, or the user's own growth", () => {
    expect(said({ investment: { kind: "asset", asset: "savings" } })).toContain(t.investedIn.asset(m.assets.inSentence.savings));
    expect(said({ investment: { kind: "custom" }, assumptions: { ...EXAMPLE_PLAN.assumptions, growth: 0.06 } })).toContain(t.investedIn.custom(f.rate(0.06)));
    expect(said({ investment: { kind: "mix", parts: [{ asset: "world", weight: 60 }, { asset: "bonds", weight: 40 }], rebalance: false } })).toContain(t.investedIn.mix);
  });
});

describe.each(["en", "es"] as const)("“See my result”, only the first time (%s)", (locale) => {
  const { m } = getI18n(locale);
  const seeButtons = (state: AppState) => count(render(locale, state, createElement(MoneyModule)), `>${m.calculator.see}`);
  afterEach(() => firstResult.set(false));

  it("is there until the first result is asked for", () => {
    expect(seeButtons(INITIAL_STATE)).toBe(1);
    expect(seeButtons(filled)).toBe(1);
  });

  it("is gone for good once it was pressed: every field, emptied or changed, updates the result live", () => {
    firstResult.set(true);
    const changes: Partial<AppState["plan"]>[] = [
      {},
      { invested: null },
      { monthlyContribution: null },
      { invested: 0, monthlyContribution: 0 },
      { years: 37 },
      { investment: { kind: "asset", asset: "world" }, assumptions: STANDARD_ASSUMPTIONS },
      { assumptions: { ...EXAMPLE_PLAN.assumptions, growth: 0.07 } },
      { assumptions: { ...EXAMPLE_PLAN.assumptions, volatility: 0.1, inflation: 0.04 } },
      { withdrawalRate: 0.03 },
    ];
    for (const change of changes) expect(seeButtons({ ...filled, plan: { ...EXAMPLE_PLAN, ...change } }), JSON.stringify(change)).toBe(0);
    // An amount taken away: the line says what is missing, and typing it back brings the result, no press.
    expect(text(render(locale, { ...filled, plan: { ...EXAMPLE_PLAN, monthlyContribution: null } }, createElement(MoneyModule)))).toContain(m.calculator.calm);
    expect(text(render(locale, filled, createElement(MoneyModule)))).not.toContain(m.calculator.calm);
  });
});

describe.each(["en", "es"] as const)("the page after the first result, by its width (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  afterEach(() => firstResult.set(false));
  const page = () => {
    firstResult.set(true);
    return render(locale, filled, createElement(MoneyModule));
  };

  it("starts as one column with the steps, and turns into the result layout once asked", () => {
    expect(render(locale, filled, createElement(MoneyModule))).toContain('data-layout="start"');
    expect(page()).toContain('data-layout="results"');
  });

  it("is three columns from 1440 px (What if…? | result, at least 640 px | steps) and two from 1024 px (result | steps)", () => {
    const html = page();
    const root = html.match(/<div data-layout="results" class="([^"]+)"/)?.[1] ?? "";
    expect(root).toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(root).toContain("wide:grid-cols-[15rem_minmax(40rem,1fr)_20rem]");
    // The left column, What if…?, only from 1440 px, in sight while the page scrolls.
    expect(html).toMatch(/<aside class="hidden wide:sticky wide:top-4 wide:block/);
    // The steps on the right from 1024 px, in sight, compact (the field under each question).
    const steps = html.match(/<div id="[^"]+" style="view-transition-name:steps" class="([^"]+)"/)?.[1] ?? "";
    expect(steps).toContain("lg:sticky");
    expect(html).not.toContain("md:grid-cols-[1.75rem_16rem_22rem]");
    // Under the steps, What if…? from 1024 to 1439 px only.
    expect(html).toContain("hidden lg:block wide:hidden");
  });

  it("on a phone, hides the steps behind a bar at the foot of the screen: the plan in one line and Edit", () => {
    const html = decode(page());
    const steps = html.match(/<div id="([^"]+)" style="view-transition-name:steps" class="([^"]+)"/);
    expect(steps?.[2]).toContain("max-lg:hidden");
    const bar = html.slice(html.lastIndexOf('<div class="fixed inset-x-0 bottom-0'));
    expect(bar).toContain("lg:hidden");
    expect(text(bar)).toContain(m.calculator.summary(f.eur(1000), f.eur(200), f.rate(0.05), m.units.years(20)));
    expect(bar).toMatch(new RegExp(`<button type="button" aria-expanded="false" aria-controls="${steps?.[1]}"[^>]*>.*${m.calculator.edit}`));
  });

  it("opens the steps from below over at most half the screen, leaving the big number in sight", () => {
    const source = readFileSync(new URL("./money-module.tsx", import.meta.url), "utf8");
    expect(source).toContain("max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0");
    expect(source).toContain("max-lg:max-h-[50dvh]");
    expect(source).toContain("document.getElementById(TOTAL_ID)");
    // It slides up only for those who allow motion.
    expect(source).toContain("motion-safe:max-lg:starting:translate-y-full");
  });

  it("shows What if…? as a section under the chart on a phone only", () => {
    const bundle = calculationFor(filled, today);
    const html = decode(render(locale, filled, createElement(Results, { bundle })));
    const section = html.match(new RegExp(`<section aria-labelledby="[^"]+" class="([^"]+)"><h2[^>]*>${m.whatIf.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    expect(section?.[1]).toContain("lg:hidden");
    expect(html.indexOf('role="img"')).toBeLessThan(html.indexOf(m.whatIf.title));
  });

  it("glides from the steps to the result with a view transition, never for those who ask for less motion", () => {
    const source = readFileSync(new URL("./money-module.tsx", import.meta.url), "utf8");
    expect(source).toContain("startViewTransition");
    expect(source).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
  });
});

describe.each(["en", "es"] as const)("the same figures everywhere (%s)", (locale) => {
  const i18n = getI18n(locale);
  const { m, f } = i18n;
  const state: AppState = { ...filled, plan: { ...EXAMPLE_PLAN, invested: 20_000, monthlyContribution: 400 } };
  const bundle = calculationFor(state, today);
  const { result, countries } = bundle.calc;
  const results = decode(render(locale, state, createElement(Results, { bundle })));
  const where = decode(render(locale, state, createElement(WhereDetails, { bundle })));
  afterEach(() => firstResult.set(false));

  it("names in the table of “Where it reaches” the country “Enough to live in” names", () => {
    const dearest = dearestCovered(countries);
    expect(dearest).not.toBeNull();
    const name = countryName(dearest?.code ?? "", i18n);
    expect(text(results)).toContain(`${m.facts.lives} ${name}`);
    const table = where.slice(where.indexOf("<tbody"), where.indexOf("</tbody>"));
    expect(text(table)).toContain(name);
  });

  it("says the same “could pay you” in the key figure and in the table's title", () => {
    const paid = f.smallEur(result.income);
    expect(text(results)).toContain(`${m.facts.pays} ${paid}`);
    expect(text(where)).toContain(m.countryTable.title(m.result.perMonth(paid)));
  });

  it("says the same monthly amount and growth in the steps, the result's sentence and the bar", () => {
    firstResult.set(true);
    const page = text(render(locale, state, createElement(MoneyModule)));
    const sentence = m.result.summary(f.eur(20_000), f.eur(400), m.result.investedIn.custom(f.rate(0.05)), m.units.years(20));
    expect(text(results)).toContain(sentence);
    expect(page).toContain(m.calculator.summary(f.eur(20_000), f.eur(400), f.rate(0.05), m.units.years(20)));
    const fields = [...render(locale, state, createElement(CalculatorCard, { compact: true })).matchAll(/<input[^>]*\svalue="([^"]*)"/g)].map((match) => match[1]);
    expect(fields).toEqual([locale === "en" ? "20,000" : "20.000", "400", "5", "20"]);
  });
});

describe("the chart's tabs", () => {
  it("change only how many years it shows, never more than the plan has", () => {
    expect(PERIODS).toEqual([5, 10, 20, 30, "all"]);
    expect(shownYears(5, 20)).toBe(5);
    expect(shownYears(20, 20)).toBe(20);
    expect(shownYears(30, 20)).toBe(20);
    expect(shownYears("all", 37)).toBe(37);
  });
});

describe("what loads with the first screen", () => {
  const source = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");
  const staticImports = (file: string) => [...source(file).matchAll(/^import [^;]* from "([^"]+)";$/gm)].map((match) => match[1]);

  it("loads the result, the folded cards and More options only when they are needed", () => {
    expect(staticImports("./money-module.tsx")).not.toContain("./results");
    expect(source("./money-module.tsx")).toContain('import("./results")');
    expect(staticImports("./calculator-card.tsx")).not.toContain("./more-options");
    expect(source("./calculator-card.tsx")).toContain('import("./more-options")');
    expect(source("./key-facts.tsx")).toContain('import("./pay-details")');
    expect(staticImports("./key-facts.tsx")).not.toContain("./pay-details");
    expect(source("./where-details.tsx")).toContain('import("./things-section")');
    expect(staticImports("./where-details.tsx")).not.toContain("./things-section");
    for (const details of ["./where-details", "./goals-section", "./know-details"]) {
      expect(staticImports("./results.tsx")).not.toContain(details);
      expect(source("./results.tsx")).toContain(`import("${details}")`);
    }
  });

  it("turns “See my result” on once both amounts are typed, and waits for it to be pressed", () => {
    const { m } = getI18n("en");
    const seeButton = (state: AppState) => decode(render("en", state, createElement(MoneyModule))).match(new RegExp(`<button[^>]*>${m.calculator.see}`))?.[0] ?? "";
    expect(seeButton({ ...INITIAL_STATE, plan: { ...EXAMPLE_PLAN, monthlyContribution: null } })).toContain('aria-disabled="true"');
    expect(seeButton({ ...INITIAL_STATE, plan: { ...EXAMPLE_PLAN, invested: null } })).toContain('aria-disabled="true"');
    expect(seeButton(filled)).toContain('aria-disabled="false"');
    const ready = text(render("en", filled, createElement(MoneyModule)));
    expect(ready).not.toContain(m.calculator.calm);
    // Nothing of the result before the press: the steps, the button and what to trust.
    expect(ready).not.toContain(m.result.label);
    expect(ready).toContain(m.money.trust.noAccount);
  });

  it("brings the result in with a short fade and rise, only for those who allow motion, and glides to it", () => {
    expect(source("./results.tsx")).toContain("motion-safe:animate-reveal");
    expect(source("../../app/globals.css")).toMatch(/--animate-reveal: reveal [\d.]+s/);
    expect(source("./results.tsx")).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    expect(source("./results.tsx")).toContain("scrollIntoView");
  });
});
