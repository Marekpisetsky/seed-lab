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
import { whatIfEffects } from "@/lib/calculator";
import { parseIsoDate } from "@/lib/dates";
import { toNominal } from "@/lib/investment";
import { bandsFor } from "@/lib/projections";
import { EXAMPLE_PLAN, MAX_YEARS_AHEAD } from "@/lib/validation";
import { CalculatorCard } from "./calculator-card";
import { GoalsSection } from "./goals-section";
import { PERIODS, shownYears } from "./growth-chart";
import { MoneyModule } from "./money-module";
import { Results } from "./results";
import { StepHint } from "./step-hints";
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
  const { m } = getI18n(locale);
  const html = render(locale, INITIAL_STATE, createElement(MoneyModule));

  it("asks in four numbered steps, with nothing filled in but the growth and the years", () => {
    const { steps } = m.calculator;
    const titles = [steps.have.title, steps.monthly.title, steps.growth.title, steps.years.title];
    const words = text(html);
    // In order, each with its number before it.
    titles.forEach((title, index) => expect(words).toContain(`${index + 1} ${title}`));
    expect(titles.map((title) => words.indexOf(title))).toEqual(titles.map((title) => words.indexOf(title)).toSorted((a, b) => a - b));
    expect(count(html, "<ol")).toBe(1);
    const list = html.slice(html.indexOf("<ol"), html.indexOf("</ol>"));
    expect(count(list, "<li")).toBe(4);
    const values = [...html.matchAll(/<input[^>]*\svalue="([^"]*)"/g)].map((match) => match[1]);
    expect(values).toEqual(["", "", "20"]);
  });

  it("gives every step a short line under its title, tied to its field", () => {
    const { steps } = m.calculator;
    expect(text(html)).toContain(steps.have.hint);
    expect(text(html)).toContain(steps.monthly.hint);
    for (const [label, hint] of [[steps.have.title, steps.have.hint], [steps.monthly.title, steps.monthly.hint]]) {
      const id = decode(html).match(new RegExp(`<p id="([^"]+)"[^>]*>(?:<[^>]+>)*${hint}`))?.[1];
      expect(id, label).toBeTruthy();
      expect(html).toContain(`aria-describedby="${id}"`);
    }
  });

  it("shows what comes filled in as the step's choice, with a way to change it", () => {
    expect(text(html)).toContain(m.calculator.presetGrowth(m.assets.inSentence.sp500));
    expect(text(html)).toContain(m.calculator.presetYears(m.units.years(20)));
    // The picked chip carries a tick, and the line before rising prices sits under the chips, inside step 3.
    expect(html).toMatch(/aria-checked="true"[^>]*>S&amp;P 500 ~7[.,]5[^<]*<svg/);
    const step3 = html.slice(html.indexOf(m.calculator.steps.growth.title), html.indexOf(m.calculator.steps.years.title));
    expect(text(step3)).toMatch(/≈\s\d/);
    expect(step3.indexOf('role="radiogroup"')).toBeLessThan(step3.indexOf("≈"));
  });

  it("keeps More options last, after the steps", () => {
    expect(html.lastIndexOf("</ol>")).toBeLessThan(html.indexOf(m.more.title));
  });

  it("shows examples that read as examples, never as data", () => {
    // The empty fields' examples (the years start filled in).
    const examples = [...html.matchAll(/placeholder="([^"]*)"[^>]*value=""/g)].map((match) => match[1]);
    expect(examples).toEqual(locale === "en" ? ["e.g. 1,000", "e.g. 200"] : ["p. ej. 1.000", "p. ej. 200"]);
    expect(html).toContain("placeholder:italic");
  });

  it("says under the form what to trust: no accounts, nothing saved, the data's years", () => {
    const trust = html.slice(html.indexOf("</section>"));
    for (const point of [m.money.trust.noAccount, m.money.trust.nothingSaved, m.money.trust.data("1988–2022")]) expect(text(trust)).toContain(point);
    expect(count(trust, "<svg")).toBe(3);
    expect(count(trust, 'aria-hidden="true"')).toBeGreaterThanOrEqual(3);
  });

  it("ends the steps with “See my result”, not yet working, and says why", () => {
    const button = decode(html).match(/<button[^>]*aria-disabled="true"[^>]*>([^<]*)/);
    expect(button?.[1]).toBe(m.calculator.see);
    expect(button?.[0]).not.toMatch(/\sdisabled=/);
    const why = button?.[0].match(/aria-describedby="([^"]+)"/)?.[1];
    expect(decode(html)).toContain(`<p id="${why}" class="text-sm text-muted">${m.calculator.calm}</p>`);
    // After the four steps, before More options.
    expect(html.indexOf("</ol>")).toBeLessThan(html.indexOf(m.calculator.see));
    expect(html.indexOf(m.calculator.see)).toBeLessThan(html.indexOf(m.more.title));
  });

  it("shows no result, chart, card or warning", () => {
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("<h3>");
    expect(html).not.toContain("bg-warning-bg");
    for (const absent of [m.result.label, m.facts.pays, m.whatIf.title, m.cards.where, m.goals.title, m.findings.title]) expect(text(html)).not.toContain(absent);
    expect(helpButtons(html, locale)).toBe(0);
  });

  it("has the growth as six chips, the S&P 500 picked, and the rest folded in More options", () => {
    expect(count(html, 'role="radio"')).toBe(6);
    expect(count(html, 'aria-checked="true"')).toBe(1);
    expect(html).toMatch(/aria-checked="true"[^>]*>S&amp;P 500 ~7[.,]5/);
    expect(text(html)).toContain(m.more.title);
    expect(text(html)).not.toContain(m.more.upsTitle);
    expect(text(html)).not.toContain(m.more.pricesTitle);
    expect(html).not.toContain(`aria-label="${m.growth.mine}"`);
  });
});

describe("My %", () => {
  const { m, f } = getI18n("en");
  const mine: AppState = { ...filled, plan: { ...EXAMPLE_PLAN, investment: { kind: "custom" }, assumptions: { ...EXAMPLE_PLAN.assumptions, growth: 0.06 } } };

  it("opens a field with the one number typed, growth after rising prices, and its equivalent below, read-only", () => {
    const html = render("en", mine, createElement(CalculatorCard));
    expect(html).toMatch(new RegExp(`<input[^>]*aria-label="${m.growth.mine}"[^>]*value="6"|<input[^>]*value="6"[^>]*aria-label="${m.growth.mine}"`));
    expect(text(html)).toContain("Grows 6% a year after rising prices");
    expect(text(html)).toContain(m.growth.before(f.rate(toNominal(0.06, 0.02))));
    expect(text(html)).toContain("≈ 8.1% before inflation");
    expect(html).toMatch(/aria-checked="true"[^>]*>My %/);
  });

  it("is a chip, not an option: More options is not marked Custom until something in it changes", () => {
    expect(text(render("en", mine, createElement(CalculatorCard)))).not.toContain(m.assumptions.custom);
    const moves: AppState = { ...mine, plan: { ...mine.plan, assumptions: { ...mine.plan.assumptions, volatility: 0.1 } } };
    expect(text(render("en", moves, createElement(CalculatorCard)))).toContain(`${m.more.title} ${m.assumptions.custom}`);
  });

  it("is a chip like the others: no list to open, no switch", () => {
    const html = render("en", mine, createElement(CalculatorCard));
    expect(html).not.toContain("<select");
    expect(html).not.toContain('role="switch"');
    expect(count(html, 'role="radio"')).toBe(6);
  });
});

describe.each(["en", "es"] as const)("the result in levels (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  const bundle = calculationFor(filled, today);
  const html = render(locale, filled, createElement(Results, { bundle }));

  it("starts with what the user said, then the big number", () => {
    const said = m.result.summary(f.eur(1000), f.eur(200), m.result.investedIn.asset(m.assets.inSentence.sp500), m.units.years(20));
    expect(text(html)).toContain(said);
    expect(decode(html).indexOf(said)).toBeGreaterThan(0);
    expect(decode(html).indexOf(said)).toBeLessThan(decode(html).indexOf("text-4xl"));
  });

  it("shows the big number, the key figures right under it, then a small chart", () => {
    expect(text(html)).toContain(f.eur(bundle.calc.result.total));
    expect(count(html, 'role="img"')).toBe(1);
    const grid = html.indexOf(`aria-label="${m.facts.label}"`);
    expect(html.indexOf("text-4xl")).toBeLessThan(grid);
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

describe.each(["en", "es"] as const)("the lines beside steps 2 and 4 (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  const bundle = calculationFor(filled, today);
  const effects = whatIfEffects(bundle.base);
  const change = (id: string) => f.eurRounded(effects.find((effect) => effect.id === id)?.change ?? NaN, { signed: true });

  it("say what +€50 a month and five more years would add, the figures of their “What if…?”", () => {
    const monthly = text(render(locale, filled, createElement(StepHint, { bundle, step: "monthly" })));
    expect(monthly).toContain(m.calculator.effectIn(m.whatIf.chips["monthly-50"], change("monthly-50"), m.units.years(20)));
    const years = text(render(locale, filled, createElement(StepHint, { bundle, step: "years" })));
    expect(years).toContain(m.calculator.effect(m.whatIf.chips["years-5"], change("years-5")));
  });

  it("say nothing when five more years cannot apply", () => {
    const longest: AppState = { ...filled, plan: { ...EXAMPLE_PLAN, years: MAX_YEARS_AHEAD } };
    expect(render(locale, longest, createElement(StepHint, { bundle: calculationFor(longest, today), step: "years" }))).toBe("");
  });

  it("sit in steps 2 and 4, under their fields", () => {
    const html = render(locale, filled, createElement(CalculatorCard, { hints: { monthly: createElement("i", null, "MONTHLY-HINT"), years: createElement("i", null, "YEARS-HINT") } }));
    const steps = html.slice(html.indexOf("<ol")).split("<li").slice(1);
    expect(steps[1]).toContain("MONTHLY-HINT");
    expect(steps[3]).toContain("YEARS-HINT");
    expect(steps[1].indexOf("<input")).toBeLessThan(steps[1].indexOf("MONTHLY-HINT"));
  });
});

describe.each(["en", "es"] as const)("the sentence before the big number (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  const t = m.result;
  const said = (plan: Partial<AppState["plan"]>) => {
    const state = { ...filled, plan: { ...EXAMPLE_PLAN, ...plan } };
    return text(render(locale, state, createElement(Results, { bundle: calculationFor(state, today) })));
  };
  const sp500 = t.investedIn.asset(m.assets.inSentence.sp500);

  it("leaves out a monthly amount of zero, or money today of zero", () => {
    expect(said({ monthlyContribution: 0 })).toContain(t.summaryToday(f.eur(1000), sp500, m.units.years(20)));
    expect(said({ invested: 0 })).toContain(t.summaryMonthly(f.eur(200), sp500, m.units.years(20)));
  });

  it("names where the money goes: a chip's index, a mix, or the user's own growth", () => {
    expect(said({ investment: { kind: "asset", asset: "savings" } })).toContain(t.investedIn.asset(m.assets.inSentence.savings));
    expect(said({ investment: { kind: "custom" }, assumptions: { ...EXAMPLE_PLAN.assumptions, growth: 0.06 } })).toContain(t.investedIn.custom(f.rate(0.06)));
    expect(said({ investment: { kind: "mix", parts: [{ asset: "world", weight: 60 }, { asset: "bonds", weight: 40 }], rebalance: false } })).toContain(t.investedIn.mix);
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
    expect(staticImports("./money-module.tsx")).not.toContain("./step-hints");
    expect(source("./money-module.tsx")).toContain('import("./step-hints")');
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
