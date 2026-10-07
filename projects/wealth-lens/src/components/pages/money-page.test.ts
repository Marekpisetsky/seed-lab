import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getI18n } from "@/i18n";
import { toolById } from "@/lib/seed-lab";
import { MoneyPage } from "./money-page";

// Only the page's own top: the header, footer and calculator have their tests.
vi.mock("@/components/site/site", () => ({ Site: ({ children }: { children: ReactNode }) => children }));
// The module places the headline (in the first screen's centred column): here it only shows it.
vi.mock("@/components/money/money-module", () => ({ MoneyModule: ({ header }: { header?: ReactNode }) => header }));

describe.each(["en", "es"] as const)("My money's first screen (%s)", (locale) => {
  const { m } = getI18n(locale);
  const html = renderToStaticMarkup(createElement(MoneyPage, { locale }));

  it("opens with a short headline and one line under it, before the calculator", () => {
    expect(html).toMatch(new RegExp(`^<div[^>]*><h1[^>]*>${m.money.headline.replace(/[?¿]/g, "\\$&")}</h1><p[^>]*>${m.money.support}</p></div>`));
  });
});

it("speaks to the person and what they want, as the hub promises", () => {
  const { m } = getI18n("es");
  expect(m.money.headline).toBe("¿Qué podrías hacer con tu dinero?");
  // A trip, a home, living without working: something for someone of 20 and of 60.
  const hub = toolById("wealth-lens").description.es;
  for (const wish of ["viaje", "casa", "sin trabajar"]) {
    expect(m.money.support).toContain(wish);
    expect(hub).toContain(wish);
  }
});
