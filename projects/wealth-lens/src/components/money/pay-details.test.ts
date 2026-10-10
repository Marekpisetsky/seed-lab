import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { KIT_WORDS } from "@seed-kit/words/index.ts";
import { I18nProvider } from "@/components/i18n";
import { calculationFor } from "@/hooks/use-calculation";
import { getI18n, type I18n } from "@/i18n";
import type { Locale } from "@/i18n/locales";
import { INITIAL_STATE, type AppState } from "@/lib/app-store";
import { parseIsoDate } from "@/lib/dates";
import { assetSafeRate } from "@/lib/safe-rate";
import { STANDARD_ASSUMPTIONS, type Plan } from "@/lib/types";
import { EXAMPLE_PLAN } from "@/lib/validation";
import { PayDetails, sliderSteps } from "./pay-details";

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
});

describe("the rate the data back, under the slider", () => {
  it("US stocks: the rate, what it pays, every start since 1928, the worst, the runs, and why", () => {
    const html = render({ investment: { kind: "asset", asset: "sp500" }, withdrawalRate: null });
    const rate = getI18n("en").f.rate(assetSafeRate("sp500").rate);
    expect(html).toMatch(new RegExp(`For US stocks, the data back ${rate.replace(".", "\\.")}: €[\\d,]+ a month\\.`));
    expect(html).toContain("It lasted 30 years from every start since 1928. The worst start: 1929.");
    expect(html).toContain(`${assetSafeRate("sp500").periods} runs of 30 years in the data.`);
    expect(html).not.toContain("Few runs");
    expect(html).toContain(KIT_WORDS.en.withdrawal.why);
    expect(html).not.toContain("Use the data's rate");
  });

  it("gold: few runs, and it says so", () => {
    expect(render({ investment: { kind: "asset", asset: "gold" }, withdrawalRate: null })).toContain("Few runs: take it as a rough guide.");
  });

  it("a savings account: the same every year", () => {
    expect(render({ investment: { kind: "asset", asset: "savings" }, withdrawalRate: null })).toMatch(/The same growth every year: [\d.]+%, €[\d,]+ a month, lasts 30 years\./);
  });

  it("my own growth: no history, and what a fall like the worst year of US stocks would do", () => {
    const html = render({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05 }, withdrawalRate: 0.07 });
    expect(html).toContain("Your own growth has no history. The rate is yours.");
    expect(html).toMatch(/First, a fall like the worst year of US stocks \(−\d+%, \d{4}\): 7%, €[\d,]+ a month, runs out after \d+ years\./);
  });

  it("a rate the user chose: says so, with a way back to the data's", () => {
    const html = render({ investment: { kind: "asset", asset: "sp500" }, withdrawalRate: 0.05 });
    expect(html).toContain("You chose 5%.");
    expect(html).toContain("Use the data's rate");
  });

  it("speaks Spanish with the line of the brief", () => {
    const html = render({ investment: { kind: "asset", asset: "sp500" }, withdrawalRate: null }, "es");
    expect(html).toContain("Más rentabilidad suele traer caídas más fuertes. Una caída al principio del retiro obliga a vender barato. Por eso la tasa segura no sube igual.");
    expect(html).toContain("Duró 30 años empezando en cualquier año desde 1928. El peor comienzo: 1929.");
  });
});
