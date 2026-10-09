import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { percentWithoutMoney, textBlocks } from "@seed-kit/plain-language.ts";
import { I18nProvider } from "@/components/i18n";
import { getI18n, type I18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { INITIAL_STATE, type AppState } from "@/lib/app-store";
import { calculate } from "@/lib/calculator";
import { parseIsoDate } from "@/lib/dates";
import { CRISES, crisisResult, fallAmount, historySource } from "@/lib/history-test";
import { EXAMPLE_PLAN } from "@/lib/validation";
import type { Plan } from "@/lib/types";
import { TestPage } from "@/components/pages/test-page";
import { CrisisPanel } from "./test-module";

// The page reads the app's state through this hook: each test gives its own.
const app = vi.hoisted(() => ({ state: null as AppState | null }));
vi.mock("@/hooks/use-app", () => ({ useAppState: () => app.state }));
vi.mock("@/hooks/use-plan", async (original) => ({ ...(await original<object>()), useToday: () => parseIsoDate("2026-09-30") }));
afterEach(() => {
  app.state = null;
});

const today = parseIsoDate("2026-09-30");
const Provider = I18nProvider as React.FC<{ i18n: I18n; children?: React.ReactNode }>;
const decode = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const text = (html: string) => decode(html.replace(/<[^>]+>/g, " ")).replace(/[ \t\r\n]+/g, " ");

const sp500: Plan = { ...EXAMPLE_PLAN, invested: 1_100, monthlyContribution: 100, investment: { kind: "asset", asset: "sp500" } };
const mix: Plan = { ...sp500, investment: { kind: "mix", parts: [{ asset: "sp500", weight: 60 }, { asset: "bonds", weight: 40 }], rebalance: true } };

function render(locale: Locale, plan: Plan, element: React.ReactElement): string {
  app.state = { ...INITIAL_STATE, plan };
  return renderToStaticMarkup(createElement(Provider, { i18n: getI18n(locale) }, element));
}

describe.each(["en", "es"] as const)("Test my plan (%s)", (locale) => {
  const { m, f } = getI18n(locale);
  const t = m.test;
  const page = render(locale, sp500, createElement(TestPage, { locale }));

  it("opens with a one-line headline and says it is real history", () => {
    expect(decode(page)).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
    expect(decode(page)).toContain(`>${t.headline}</h1>`);
    expect(text(page)).toContain(t.realHistory);
  });

  it("shows each crisis as a big card with its year, a small line and one figure in the user's euros", () => {
    const calc = calculate(sp500, today);
    const source = historySource(calc.investment);
    const cards = decode(page).split('aria-pressed="false"').slice(1);
    expect(cards).toHaveLength(CRISES.length);
    CRISES.forEach((crisis, index) => {
      const card = cards[index];
      expect(text(card)).toContain(t.crises[crisis.id]);
      expect(text(card)).toContain(String(crisis.year));
      const result = source && crisisResult(source, { start: 1_100, monthly: 100 }, calc.result.years, crisis.id);
      if (!result) return expect(text(card)).toContain(t.noData);
      expect(card).toContain("<polyline");
      if (!result.fall) return expect(text(card)).toContain(t.card.noFall);
      // Only euros: no percent on a card.
      expect(text(card.slice(card.indexOf("</svg>")))).toContain(f.cur(-fallAmount(result), { signed: true }));
      expect(text(card.slice(0, card.indexOf("</button>")))).not.toMatch(/%/);
    });
  });

  it("opens a crisis with what happened, its chart and how long it took, the rest behind “See more”", () => {
    const calc = calculate(sp500, today);
    const source = historySource(calc.investment)!;
    const result = crisisResult(source, { start: 1_100, monthly: 100 }, calc.result.years, "financial")!;
    const html = render(locale, sp500, createElement(CrisisPanel, { result, source, amounts: { start: 1_100, monthly: 100 }, scenario: calc.scenario, planYears: calc.result.years, name: "S&P 500" }));
    expect(text(html)).toContain(t.happened.financial);
    expect(html).toContain('role="img"');
    expect(text(html)).toContain(t.card.fall(f.cur(-fallAmount(result), { signed: true }), f.span((result.yearsToRecover ?? 0) * 12)));
    expect(text(html)).toContain(m.cards.more);
    expect(text(html)).not.toContain(t.started(result.startYear));
  });

  it("never shows a percent without its euros", () => {
    for (const plan of [sp500, mix]) {
      const calc = calculate(plan, today);
      const source = historySource(calc.investment)!;
      const panels = CRISES.map((crisis) => crisisResult(source, { start: 1_100, monthly: 100 }, calc.result.years, crisis.id))
        .filter((result) => result !== null)
        .map((result) => render(locale, plan, createElement(CrisisPanel, { result, source, amounts: { start: 1_100, monthly: 100 }, scenario: calc.scenario, planYears: calc.result.years, name: "x" })));
      const blocks = textBlocks([render(locale, plan, createElement(TestPage, { locale })), ...panels].join(""));
      expect(percentWithoutMoney(blocks)).toEqual([]);
    }
  });
});
