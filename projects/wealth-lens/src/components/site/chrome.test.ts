import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { footerHtml, headerHtml } from "@seed-kit/chrome-html.ts";
import { footerModel, headerModel } from "@seed-kit/chrome.ts";
import { SiteFooter, SiteHeader } from "@seed-kit/react/chrome.tsx";

/**
 * seed-kit's header and footer come in two renderers: static HTML (the hub,
 * the tools Forja makes) and React (here). They must draw the same thing,
 * so every seed-lab app wears one header and one footer.
 */

/**
 * The same markup, whatever the spaces between tags, the case of attribute
 * names (React writes "hrefLang"; HTML reads both alike) and the launcher's
 * id (React makes its own, so two headers never share one).
 */
const normal = (markup: string) =>
  markup
    .replace(/>\s+</g, "><")
    .replace(/ hrefLang=/g, " hreflang=")
    .replace(/(aria-controls|id)="(_R_|«|:R)[^"]*"/g, '$1="sk-launcher"')
    .trim();

describe("the seed-lab header and footer", () => {
  for (const locale of ["en", "es"] as const) {
    const header = headerModel({
      locale,
      name: "Wealth Lens",
      homeHref: locale === "en" ? "/" : "/es",
      nav: [
        { label: "My money", href: "/", current: true },
        { label: "My stocks", href: "/stocks" },
      ],
      languageHrefs: { en: "/", es: "/es" },
      current: "wealth-lens",
    });
    const footer = footerModel({ locale, links: [{ label: "About", href: "/about" }], notes: ["Nothing is saved or sent."] });

    it(`draws the same header in React and in HTML (${locale})`, () => {
      expect(normal(renderToStaticMarkup(createElement(SiteHeader, { model: header })))).toBe(normal(headerHtml(header).value));
    });

    it(`draws the same footer in React and in HTML (${locale})`, () => {
      const react = renderToStaticMarkup(createElement(SiteFooter, { model: footer }, createElement("p", null, "Controls")));
      expect(normal(react)).toBe(normal(footerHtml(footer, "<p>Controls</p>").value));
    });
  }

  it("marks Wealth Lens as the tool you are in, and links the hub", () => {
    const markup = renderToStaticMarkup(
      createElement(SiteHeader, {
        model: headerModel({ locale: "en", name: "Wealth Lens", homeHref: "/", languageHrefs: { en: "/", es: "/es" }, current: "wealth-lens" }),
      }),
    );
    expect(markup).toMatch(/<a href="\/" aria-current="true"><span class="sk-tool">Wealth Lens<\/span><span class="sk-here">/);
    expect(markup).toMatch(/<a class="sk-hub" href="https:\/\/[^"]+">/);
  });
});
