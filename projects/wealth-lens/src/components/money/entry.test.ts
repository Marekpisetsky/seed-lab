import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/i18n";
import { calculationFor } from "@/hooks/use-calculation";
import { getI18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { INITIAL_STATE, type AppState } from "@/lib/app-store";
import { parseIsoDate } from "@/lib/dates";
import { toNominal } from "@/lib/investment";
import { EXAMPLE_PLAN } from "@/lib/validation";
import { CalculatorCard } from "./calculator-card";
import { MoneyModule } from "./money-module";
import { Results } from "./results";

// The page reads the app's state through this hook: each test gives its own.
const app = vi.hoisted(() => ({ state: null as AppState | null }));
vi.mock("@/hooks/use-app", () => ({ useAppState: () => app.state }));

const today = parseIsoDate("2026-09-30");
const filled: AppState = { ...INITIAL_STATE, plan: EXAMPLE_PLAN };

const Provider = I18nProvider as React.FC<{ locale: Locale; children?: React.ReactNode }>;

function render(locale: Locale, state: AppState, element: React.ReactElement): string {
  app.state = state;
  return renderToStaticMarkup(createElement(Provider, { locale }, element));
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

  it("asks the four questions, with nothing filled in but the years", () => {
    for (const question of [m.calculator.haveQ, m.calculator.monthlyQ, m.calculator.growthQ, m.calculator.yearsQ]) expect(text(html)).toContain(question);
    const values = [...html.matchAll(/<input[^>]*\svalue="([^"]*)"/g)].map((match) => match[1]);
    expect(values).toEqual(["", "", "20"]);
  });

  it("shows examples that read as examples, never as data", () => {
    // The empty fields' examples (the years start filled in).
    const examples = [...html.matchAll(/placeholder="([^"]*)"[^>]*value=""/g)].map((match) => match[1]);
    expect(examples).toEqual(locale === "en" ? ["e.g. 1,000", "e.g. 200"] : ["p. ej. 1.000", "p. ej. 200"]);
    expect(html).toContain("placeholder:italic");
  });

  it("shows one calm line and no result, chart, card or warning", () => {
    expect(text(html)).toContain(m.calculator.calm);
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("<h3>");
    expect(html).not.toContain("bg-warning-bg");
    for (const absent of [m.result.label, m.result.couldPay, m.whatIf.title, m.cards.where, m.goals.title, m.findings.title]) expect(text(html)).not.toContain(absent);
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

  it("shows the big number with its growth line, then a small chart", () => {
    expect(text(html)).toContain(m.result.inYears(m.units.years(20)));
    expect(text(html)).toContain(f.eur(bundle.calc.result.total));
    expect(count(html, 'role="img"')).toBe(1);
    expect(html.indexOf(f.eur(bundle.calc.result.total))).toBeLessThan(html.indexOf('role="img"'));
  });

  it("folds the rest into five one-line cards, each with what it says", () => {
    expect(count(html, FOLDED)).toBe(5);
    expect(count(html, "<h3>")).toBe(5);
    const words = text(html);
    expect(words).toContain(`${m.result.couldPay} ${m.result.perMonth(f.smallEur(bundle.calc.result.income))}`);
    expect(words).toMatch(new RegExp(`${m.whatIf.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\+`));
    expect(words).toContain(m.cards.whereSummary(bundle.calc.countries.filter((row) => row.withoutHousing.covered).length, bundle.calc.countries.length));
    expect(words).toContain(m.cards.goalsNone);
    expect(words).toContain(m.cards.knowSummary);
  });

  it("shows what a card holds only once it is opened", () => {
    const words = text(html);
    for (const inside of [m.help.income, m.help.whatIf, m.things.title, m.help.goals, m.result.takenOut]) expect(words).not.toContain(inside);
    expect(html).not.toContain('type="search"');
  });

  it("keeps a single “?”, beside the big number", () => {
    expect(count(html, m.help.button(m.result.inYears(m.units.years(20))))).toBe(1);
    expect(helpButtons(html, locale)).toBe(1);
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
    for (const details of ["./pay-details", "./where-details", "./goals-section", "./know-details"]) {
      expect(staticImports("./results.tsx")).not.toContain(details);
      expect(source("./results.tsx")).toContain(`import("${details}")`);
    }
  });

  it("shows the result once both amounts are typed, and the calm line until then", () => {
    const { m } = getI18n("en");
    expect(text(render("en", { ...INITIAL_STATE, plan: { ...EXAMPLE_PLAN, monthlyContribution: null } }, createElement(MoneyModule)))).toContain(m.calculator.calm);
    expect(text(render("en", { ...INITIAL_STATE, plan: { ...EXAMPLE_PLAN, invested: null } }, createElement(MoneyModule)))).toContain(m.calculator.calm);
    expect(text(render("en", filled, createElement(MoneyModule)))).not.toContain(m.calculator.calm);
  });
});
