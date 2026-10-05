import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JARGON, hasJargon, percentWithoutMoney, plainLanguageProblems, textBlocks } from "@seed-kit/plain-language.ts";
import { I18nProvider } from "@/components/i18n";
import { calculationFor } from "@/hooks/use-calculation";
import { getI18n, type I18n } from "@/i18n";
import { LOCALES, type Locale } from "@/i18n/locales";
import { INITIAL_STATE, type AppState } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { connectionsData } from "@/lib/connections";
import { parseIsoDate } from "@/lib/dates";
import { allFindings } from "@/lib/findings";
import { STANDARD_ASSUMPTIONS, type Holding, type Plan } from "@/lib/types";
import type { WhatIfId } from "@/lib/what-if";
import { EXAMPLE_PLAN } from "@/lib/validation";
import { FuturesView } from "./money/futures-view";
import { GoalsSection } from "./money/goals-section";
import { KnowDetails } from "./money/know-details";
import { PayDetails } from "./money/pay-details";
import { Results } from "./money/results";
import { StocksSummary } from "./money/stocks-summary";
import { WhatIfRow } from "./money/what-if-row";
import { WhereDetails } from "./money/where-details";

// The result reads the app's state through this hook: each case gives its own.
const app = vi.hoisted(() => ({ state: null as AppState | null }));
vi.mock("@/hooks/use-app", () => ({ useAppState: () => app.state }));
afterEach(() => {
  app.state = null;
});

/**
 * Every word on the screen comes from the dictionaries (src/i18n/messages),
 * and reads without help: no jargon, short sentences. The technical words
 * may only appear in `explain`, the folded "i" explanations, each next to
 * its plain name. The words and the counting are seed-kit's plain-language
 * check, the one every seed-lab tool runs; this file finds the texts.
 */

const SRC = fileURLToPath(new URL("..", import.meta.url));
const MESSAGES = join(SRC, "i18n/messages");

/** Namespaces where the technical words may appear: the folded explanations. */
const TECHNICAL = new Set(["explain"]);
/** At most this many words in a sentence, about ten ("1 %", "9700 €" and a filled-in value are one word each). */
const MAX_WORDS = 12;
/** Long-form pages (How it works, Privacy…): whole paragraphs, still in short sentences. */
const MAX_WORDS_PAGES = 22;
const PAGES = new Set(["about", "howItWorks", "privacy", "terms", "notFound", "explain"]);

interface Entry {
  /** "findings.lever.goalMonthly" */
  path: string;
  text: string;
}

/** Every text of a dictionary file with its key: string literals, and templates with each `${…}` as "X". */
function dictionaryTexts(file: string): Entry[] {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const entries: Entry[] = [];
  const visit = (node: ts.Node, path: string[]) => {
    if (ts.isImportDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) return;
    if (ts.isPropertyAssignment(node)) {
      const key = node.name.getText(source).replace(/^"|"$/g, "");
      ts.forEachChild(node, (child) => visit(child, [...path, key]));
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (/[a-zá-ú]{2}/i.test(node.text)) entries.push({ path: path.join("."), text: node.text });
      return;
    }
    if (ts.isTemplateExpression(node)) {
      const text = node.head.text + node.templateSpans.map((span) => `X${span.literal.text}`).join("");
      entries.push({ path: path.join("."), text });
      // The expressions inside can hold texts of their own ("above" : "below").
      node.templateSpans.forEach((span) => visit(span.expression, path));
      return;
    }
    ts.forEachChild(node, (child) => visit(child, path));
  };
  visit(source, []);
  return entries;
}

const dictionaries = LOCALES.map((locale) => ({ locale, entries: dictionaryTexts(join(MESSAGES, `${locale}.ts`)) }));

describe("the dictionaries", () => {
  it("are read whole", () => {
    for (const { entries } of dictionaries) {
      expect(entries.length).toBeGreaterThan(500);
      expect(entries.some((entry) => entry.path === "findings.lever.goalMonthly")).toBe(true);
    }
  });

  it("never show real, nominal, volatility, swings or percentile outside the folded explanations, in any language", () => {
    const found = dictionaries.flatMap(({ locale, entries }) =>
      entries
        .filter((entry) => !TECHNICAL.has(entry.path.split(".")[0]))
        .filter((entry) => hasJargon(entry.text, locale))
        .map((entry) => `${locale} ${entry.path}: ${entry.text}`),
    );
    expect(found).toEqual([]);
  });

  it("would catch them", () => {
    expect(JARGON.en.test("Growth a year, after inflation (real)")).toBe(true);
    expect(JARGON.en.test("big swings")).toBe(true);
    expect(JARGON.en.test("what your money can really buy")).toBe(false);
    expect(JARGON.es.test("rentabilidad real")).toBe(true);
    expect(JARGON.es.test("la volatilidad del índice")).toBe(true);
    expect(JARGON.es.test("el percentil 10")).toBe(true);
    expect(JARGON.es.test("lo que de verdad puedes comprar")).toBe(false);
  });

  it("speak in short sentences", () => {
    const long = dictionaries.flatMap(({ locale, entries }) =>
      plainLanguageProblems(entries, locale, {
        maxWords: MAX_WORDS,
        longForm: { maxWords: MAX_WORDS_PAGES, paths: (path) => PAGES.has(path.split(".")[0]) },
        // Jargon has its own test above.
        technical: () => true,
        // A source is a citation ("average cost of a Dutch B licence in 2025, 41 lessons and exams"), not a sentence to read.
        skip: (path) => path.endsWith(".source"),
      }),
    );
    expect(long).toEqual([]);
  });

  it("name and source every thing to buy, in every language", () => {
    for (const locale of LOCALES) {
      const { things } = getI18n(locale).m;
      for (const item of connectionsData.buy) {
        expect(things.items[item.id]?.name, `${locale} ${item.id}`).toBeTruthy();
        expect(things.items[item.id]?.source, `${locale} ${item.id}`).toBeTruthy();
      }
    }
  });
});

/** Attributes that never show text. */
const HIDDEN_ATTRIBUTES = new Set([
  "className",
  "strongClassName",
  "optionClassName",
  "id",
  "key",
  "type",
  "role",
  "href",
  "to",
  "htmlFor",
  "name",
  "rel",
  "target",
  "d",
  "viewBox",
  "fill",
  "stroke",
  "accept",
  "autoComplete",
  "autoCapitalize",
  "inputMode",
  "lang",
  "locale",
  "dateTime",
  "src",
  "method",
  "pattern",
  "list",
  "httpEquiv",
  "content",
  "step",
  "side",
  "enterKeyHint",
  "layout",
  "preserveAspectRatio",
  "strokeLinejoin",
  "strokeLinecap",
  "vectorEffect",
  "textAnchor",
  "dominantBaseline",
  "variant",
  "size",
  "tone",
  "align",
  "aria-hidden",
  "aria-live",
  "aria-atomic",
  "aria-expanded",
  "aria-autocomplete",
  "aria-haspopup",
  "aria-controls",
  "aria-labelledby",
  "aria-describedby",
  "aria-current",
  "aria-orientation",
  "placeholder",
  "scope",
  "page",
  "paintOrder",
  "color",
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/** Words a component writes itself instead of taking them from the dictionary. */
function literalTexts(path: string): string[] {
  const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const texts: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(file);
      if (HIDDEN_ATTRIBUTES.has(name) || name.startsWith("data-")) return;
      if (node.initializer && ts.isStringLiteral(node.initializer) && /\p{L}{2}/u.test(node.initializer.text)) texts.push(`${name}="${node.initializer.text}"`);
    }
    if (ts.isJsxText(node) && /\p{L}{2}/u.test(node.text)) texts.push(node.text.trim());
    ts.forEachChild(node, visit);
  };
  visit(file);
  return texts;
}

describe("the components", () => {
  const files = [...sourceFiles(join(SRC, "components")), ...sourceFiles(join(SRC, "app"))];

  it("are read whole", () => {
    expect(files.some((path) => path.endsWith("calculator-card.tsx"))).toBe(true);
    expect(files.some((path) => path.endsWith("more-options.tsx"))).toBe(true);
    expect(literalTexts(join(SRC, "components/plain-language.fixture.tsx.txt"))).toEqual(["Hello there", 'aria-label="Close it"']);
  });

  it("take every word from the dictionaries", () => {
    const found = files.flatMap((path) => literalTexts(path).map((text) => `${relative(SRC, path)}: ${text}`));
    expect(found).toEqual([]);
  });
});

/**
 * seed-lab's rule for money: no percentage without what it is in euros of
 * the user's money ("A fall like 2008's (−37%) = −€407 of your €1,100").
 * Checked on what the result shows, in every language and for plans of
 * every kind: every block of text (and every label a screen reader says)
 * with a percent also has an amount in euros. The steps and More options,
 * where the user types a percent, and the method pages are not the result.
 */
describe("no percentage without its euros, in the result", () => {
  const today = parseIsoDate("2026-09-30");
  const holding = (ticker: string, quantity: number, price: number): Holding => ({
    id: ticker,
    ticker,
    quantity,
    costBasis: quantity * price * 0.8,
    currency: "EUR",
    currentPrice: price,
    priceSource: "manual",
    priceDate: null,
  });
  const goals: Plan["goals"] = [
    { id: "a", kind: "amount", amount: 50_000 },
    { id: "b", kind: "live", country: "PT", housing: true },
    { id: "c", kind: "monthly", amount: 900, label: null },
  ];
  const plan = (patch: Partial<Plan> = {}): Plan => ({ ...EXAMPLE_PLAN, invested: 20_000, monthlyContribution: 400, goals, ...patch });
  const cases: { name: string; plan: Plan; holdings?: Holding[]; whatIf?: WhatIfId }[] = [
    { name: "the starting 5 %", plan: plan() },
    { name: "the S&P 500, a bad decade applied", plan: plan({ investment: { kind: "asset", asset: "sp500" } }), whatIf: "bad-decade" },
    { name: "the Nasdaq-100, price only, grows 1 % more", plan: plan({ investment: { kind: "asset", asset: "nasdaq100" } }), whatIf: "grow-more" },
    { name: "gold, nothing today", plan: plan({ investment: { kind: "asset", asset: "gold" }, invested: 0 }) },
    { name: "a savings account", plan: plan({ investment: { kind: "asset", asset: "savings" } }) },
    { name: "my own growth and ups and downs", plan: plan({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.06, volatility: 0.25 } }) },
    {
      name: "a mix with one stock over a fifth",
      plan: plan({ investment: { kind: "mix", parts: [{ asset: "world", weight: 50 }, { asset: "bonds", weight: 20 }, { asset: "nasdaq100", weight: 30, stock: "NVDA" }], rebalance: false } }),
    },
    { name: "my portfolio, most of it in one stock", plan: plan({ investment: { kind: "portfolio" }, invested: null }), holdings: [holding("ASML", 7, 1000), holding("VWCE", 20, 150)] },
  ];
  const Provider = I18nProvider as React.FC<{ i18n: I18n; children?: React.ReactNode }>;

  it.each(LOCALES.flatMap((locale) => cases.map((entry) => [locale, entry.name, entry] as const)))("%s: %s", (locale: Locale, _name, entry) => {
    const i18n = getI18n(locale);
    const state: AppState = { ...INITIAL_STATE, plan: entry.plan, holdings: entry.holdings ?? [], whatIf: entry.whatIf ?? null };
    app.state = state;
    const bundle = calculationFor(state, today);
    const render = (element: React.ReactElement) => renderToStaticMarkup(createElement(Provider, { i18n }, element));
    if (bundle.calc.scenario.head) {
      const futures = render(createElement(FuturesView, { bundle, onClose: () => {} }));
      expect(futures).toContain(locale === "en" ? "Thin lines and shading show futures without this decade." : "Las líneas finas y la franja muestran futuros sin esa década.");
      expect(futures).not.toContain(i18n.m.futures.average);
    }
    const html = [
      render(createElement(Results, { bundle })),
      render(createElement(PayDetails, { bundle })),
      render(createElement(KnowDetails, { bundle })),
      render(createElement(GoalsSection, { calc: bundle.calc, today, inCard: true })),
      render(createElement(WhereDetails, { bundle })),
      render(createElement(WhatIfRow, { bundle })),
      render(createElement(StocksSummary, { holdings: bundle.holdings })),
      bundle.calc.investment.volatility > 0 ? render(createElement(FuturesView, { bundle, onClose: () => {} })) : "",
    ].join("");
    // Every finding, not only the three shown: its line, its calculation and its assumptions.
    const findings = allFindings({ calc: bundle.base, inflation: bundle.base.investment.inflation, today, holdings: priceHoldings(state.holdings), i18n }).flatMap(
      (finding) => [`${finding.value} ${finding.text}`, ...finding.calculation, ...finding.assumptions],
    );
    const blocks = [...textBlocks(html), ...findings];
    expect(blocks.some((block) => /%/.test(block))).toBe(true);
    expect(percentWithoutMoney(blocks)).toEqual([]);
  });
});
