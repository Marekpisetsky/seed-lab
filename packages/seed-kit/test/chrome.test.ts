import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHROME_WORDS, footerModel, headerModel } from "../src/chrome.ts";
import { footerHtml, headerHtml } from "../src/chrome-html.ts";
import { LOCALES } from "../src/locales.ts";
import { HUB_URL } from "../src/site.ts";
import { SHOWN_TOOLS } from "../src/tools.ts";

const header = (locale: "en" | "es" = "en") =>
  headerModel({
    locale,
    name: "Horalis <Growth>",
    homeHref: locale === "en" ? "/" : "/es/",
    homeCurrent: true,
    nav: [
      { label: "My money", href: "/", current: true },
      { label: "My stocks", href: "/stocks" },
    ],
    languageHrefs: { en: "/", es: "/es/" },
    current: "wealth-lens",
  });

describe("the header", () => {
  it("has the seed and the app's name, its pages, EN/ES and the launcher, escaped", () => {
    const out = headerHtml(header()).value;
    assert.match(out, /<a class="sk-skip" href="#main">Skip to content<\/a>/);
    assert.match(out, /<a class="sk-brand" href="\/" aria-current="page"><span class="sk-seed"><svg[^>]*>.*<\/svg><\/span><span class="sk-name">Horalis<span class="sk-product"> &lt;Growth&gt;<\/span><\/span><\/a>/);
    assert.match(out, /<a href="\/" aria-current="page">My money<\/a>/);
    assert.match(out, /<a href="\/stocks">My stocks<\/a>/);
    assert.match(out, /<a href="\/es\/" hreflang="es" lang="es" title="Español" aria-label="Español">ES<\/a>/);
    assert.match(out, /hreflang="en" lang="en" title="English" aria-label="English" aria-current="true">EN<\/a>/);
    assert.match(out, /<details class="sk-launcher"><summary aria-label="Horalis tools"/);
  });

  it("lists the shown tools in the launcher, marking the one you are in, and links the hub", () => {
    const model = header();
    assert.equal(model.hubHref, HUB_URL);
    assert.deepEqual(model.tools.map((tool) => tool.id), SHOWN_TOOLS.map((tool) => tool.id));
    const here = model.tools.find((tool) => tool.current);
    assert.equal(here?.id, "wealth-lens");
    assert.equal(here?.href, "/", "the current tool links to its own home");
    assert.match(headerHtml(model).value, /aria-current="true"><span class="sk-tool">Horalis Growth<\/span><span class="sk-here">/);
  });

  it("shows the brand alone on the hub, and a tool's own name after it", () => {
    const hub = headerHtml(headerModel({ locale: "en", name: "Horalis", homeHref: "/", languageHrefs: { en: "/", es: "/es/" }, current: "hub" })).value;
    assert.match(hub, /<span class="sk-name">Horalis<\/span><\/a>/);
    assert.equal(header().home.product, "<Growth>");
  });

  it("speaks the page's language, and can sit on a dark band", () => {
    const es = headerHtml(header("es")).value;
    assert.match(es, /Saltar al contenido/);
    assert.match(es, /aria-label="Herramientas de Horalis"/);
    assert.match(es, /Estás aquí/);
    assert.match(headerHtml(headerModel({ ...header(), name: "Horalis", homeHref: "/", languageHrefs: { en: "/", es: "/es/" }, current: "hub", theme: "dark", locale: "en" })).value, /<header class="sk-header theme-dark">/);
  });

  it("has the same words in every language", () => {
    for (const locale of LOCALES) assert.deepEqual(Object.keys(CHROME_WORDS[locale]), Object.keys(CHROME_WORDS.en));
  });
});

describe("the footer", () => {
  it("has the app's links, then Part of Horalis, its notes and the copyright", () => {
    const out = footerHtml(footerModel({ locale: "es", links: [{ label: "Privacidad", href: "/es/privacy" }], notes: ["No se guarda nada."] }), "<div>slot</div>").value;
    assert.match(out, /<footer class="sk-footer">\n<div class="sk-wrap">\n<div>slot<\/div><nav aria-label="Más">/);
    assert.match(out, /<li><a href="\/es\/privacy">Privacidad<\/a><\/li><li><a href="https:\/\/[^"]+">Parte de Horalis<\/a><\/li>/);
    assert.match(out, /<p class="sk-note">No se guarda nada.<\/p>\n<p class="sk-note">© 2026 Horalis. De uso gratuito.<\/p>/);
  });

  it("leaves out Part of Horalis on the hub itself", () => {
    assert.doesNotMatch(footerHtml(footerModel({ locale: "en", links: [], partOf: false, theme: "light" })).value, /Part of Horalis/);
  });
});
