import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getI18n } from "@/i18n";
import { MoneyPage } from "./money-page";

// Only the page's own top: the header, footer and calculator have their tests.
vi.mock("@/components/site/site", () => ({ Site: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/money/money-module", () => ({ MoneyModule: () => null }));

describe.each(["en", "es"] as const)("My money's first screen (%s)", (locale) => {
  const { m } = getI18n(locale);
  const html = renderToStaticMarkup(createElement(MoneyPage, { locale }));

  it("opens with a short headline and one line under it, before the calculator", () => {
    expect(html).toMatch(new RegExp(`^<div[^>]*><h1[^>]*>${m.money.headline.replace(/[?¿]/g, "\\$&")}</h1><p[^>]*>${m.money.support}</p></div>`));
  });
});

it("asks the question the hub promises", () => {
  expect(getI18n("es").m.money.headline).toBe("¿Cuánto crecerá tu dinero?");
});
