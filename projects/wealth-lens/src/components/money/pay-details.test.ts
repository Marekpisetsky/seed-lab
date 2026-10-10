import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { WITHDRAWAL_WHY } from "@seed-kit/words/withdrawal.ts";
import { I18nProvider } from "@/components/i18n";
import { calculationFor } from "@/hooks/use-calculation";
import { getI18n, type I18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { INITIAL_STATE, type AppState } from "@/lib/app-store";
import { parseIsoDate } from "@/lib/dates";
import { assetSafeRate } from "@/lib/safe-rate";
import { STANDARD_ASSUMPTIONS, type Plan } from "@/lib/types";
import { EXAMPLE_PLAN } from "@/lib/validation";
import { PayDetails, sliderIndex, sliderSteps } from "./pay-details";

const app = vi.hoisted(() => ({ state: null as AppState | null }));
vi.mock("@/hooks/use-app", () => ({ useAppState: () => app.state }));

const today = parseIsoDate("2026-10-09");
const Provider = I18nProvider as React.FC<{ i18n: I18n; children?: React.ReactNode }>;
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

function render(plan: Partial<Plan>, locale: Locale = "en"): string {
  const state: AppState = { ...INITIAL_STATE, plan: { ...EXAMPLE_PLAN, invested: 100_000, monthlyContribution: 500, assumptions: STANDARD_ASSUMPTIONS, ...plan } };
  app.state = state;
  return text(renderToStaticMarkup(createElement(Provider, { i18n: getI18n(locale) }, createElement(PayDetails, { bundle: calculationFor(state, today) }))));
}

describe("the slider of “It could pay you”", () => {
  it("offers 2–7 % every 0.5 %, and the data's rate where it falls", () => {
    const steps = sliderSteps(0.0378);
    expect(steps).toContain(0.0378);
    expect(steps[0]).toBe(0.02);
    expect(steps.at(-1)).toBe(0.07);
    expect([...steps].sort((a, b) => a - b)).toEqual(steps);
    expect(sliderSteps(0.04)).toHaveLength(11);
  });

  it("never has two stops in one place: a step a hair from the data's rate gives way", () => {
    const steps = sliderSteps(0.0499);
    expect(steps).toContain(0.0499);
    expect(steps).not.toContain(0.05);
    // Right from the data's stop goes on to 5.5 %: the keyboard is never stuck.
    expect(steps[steps.indexOf(0.0499) + 1]).toBe(0.055);
  });

  it("sits on the data's stop while the plan follows it, on the user's otherwise, and near an old off-step rate", () => {
    const steps = sliderSteps(0.0378);
    expect(steps[sliderIndex(steps, 0.0378, true, 0.0378)]).toBe(0.0378);
    expect(steps[sliderIndex(steps, 0.05, false, 0.0378)]).toBe(0.05);
    expect(steps[sliderIndex(steps, 0.042, false, 0.0378)]).toBe(0.04);
  });
});

describe("the rate that lasted, under the slider", () => {
  it("US stocks: the rate, what it pays, the starts from 1928 to 1993, the worst, the runs, the past, and why", () => {
    const html = render({ investment: { kind: "asset", asset: "sp500" }, withdrawalRate: null });
    const rate = getI18n("en").f.rate(assetSafeRate("sp500").rate);
    expect(html).toMatch(new RegExp(`For US stocks, the most that lasted 30 years: ${rate.replace(".", "\\.")}, €[\\d,]+ a month\\.`));
    expect(html).toContain("It held from every start from 1928 to 1993. The worst start: 1929.");
    expect(html).toContain(`${assetSafeRate("sp500").periods} runs of 30 years in the data.`);
    expect(html).toContain("What lasted in the past is not a promise.");
    expect(html).not.toContain("rough guide");
    expect(html).toContain(WITHDRAWAL_WHY.en);
    expect(html).not.toContain("Use the data's rate");
    expect(html).toContain("Prudent");
  });

  it("gold and bonds: few runs, said first, in the same sentence as the rate", () => {
    expect(render({ investment: { kind: "asset", asset: "gold" }, withdrawalRate: null })).toMatch(/Only 8 runs for gold: a rough guide\. [\d.]+%, €[\d,]+ a month\./);
    expect(render({ investment: { kind: "asset", asset: "bonds" }, withdrawalRate: null })).toContain("It held from every start from 1988 to 1995.");
  });

  it("the same growth every year: lasts the 30 years it says, and the zone agrees (no rounding left a cent short)", () => {
    for (const growth of [0.01, 0.02, 0.05, 0.08, 0.12]) {
      const html = render({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth, volatility: 0 }, withdrawalRate: null });
      expect(html, String(growth)).toMatch(/The same growth every year: [\d.]+%, €[\d,]+ a month, lasts 30 years\./);
      expect(html, String(growth)).toContain("Prudent");
      // It runs out only after its 30 years, never a year short.
      const after = Number(/runs out after (\d+) years/.exec(html)?.[1] ?? 100);
      expect(after, String(growth)).toBeGreaterThanOrEqual(30);
      expect(html, String(growth)).not.toContain(WITHDRAWAL_WHY.en);
    }
  });

  it("a savings account where prices rise fast: a tiny rate with its decimals, never “0%”", () => {
    const html = render({ investment: { kind: "asset", asset: "savings" }, pricesOf: "IR", withdrawalRate: null });
    expect(html).not.toMatch(/(^|[^\d.])0%/);
  });

  it("my own growth: no history; where the rate starts and whose it is; and a fall like the worst year of US stocks, with its money", () => {
    const html = render({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05 }, withdrawalRate: null });
    expect(html).toContain("Your own growth has no history. The rate is yours.");
    expect(html).toMatch(/It starts at the rate of US stocks: [\d.]+%, €[\d,]+ a month\./);
    expect(html).toMatch(/First, a fall like the worst year of US stocks \(−\d+%, \d{4}\)\. €[\d,]+ would become €[\d,]+\. Then [\d.]+%, €[\d,]+ a month, (still lasts 30 years|runs out after \d+ years)\./);
    const chosen = render({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05 }, withdrawalRate: 0.07 });
    expect(chosen).toMatch(/Then 7%, €[\d,]+ a month, runs out after \d+ years\./);
    expect(chosen).not.toContain("It starts at");
  });

  it("my own growth like bonds: starts no higher than the rate with the longest history, and says so", () => {
    const html = render({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.02, volatility: 0.05 }, withdrawalRate: null });
    expect(html).toContain("It starts at the rate of US stocks");
  });

  it("a rate the user chose: says so, with a way back to the data's", () => {
    const html = render({ investment: { kind: "asset", asset: "sp500" }, withdrawalRate: 0.05 });
    expect(html).toContain("You chose 5%.");
    expect(html).toContain("Use the data's rate");
  });

  it("speaks Spanish with the line of the brief", () => {
    const html = render({ investment: { kind: "asset", asset: "sp500" }, withdrawalRate: null }, "es");
    expect(html).toContain("Más rentabilidad suele traer caídas más fuertes. Una caída al principio del retiro obliga a vender barato. Por eso la tasa segura no sube igual.");
    expect(html).toContain("Aguantó empezando en cualquier año de 1928 a 1993. El peor comienzo: 1929.");
    expect(html).toContain("Lo que aguantó en el pasado no es una promesa.");
  });
});
