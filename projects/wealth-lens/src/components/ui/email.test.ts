import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { en } from "@/i18n/messages/en";
import { enPages } from "@/i18n/messages/en-pages";
import { es } from "@/i18n/messages/es";
import { esPages } from "@/i18n/messages/es-pages";
import { CONTACT } from "@/lib/site";
import { Email } from "./email";

/** The contact address: in the static HTML only in parts, and no GitHub links on screen. */
describe("contact", () => {
  it("renders the address in two parts on the server: no @, no mail link", () => {
    const html = renderToStaticMarkup(createElement(Email));
    expect(html).toContain(`data-user="${CONTACT.user}"`);
    expect(html).toContain(`data-domain="${CONTACT.domain}"`);
    expect(html).not.toContain("@");
    expect(html).not.toMatch(/mailto/i);
  });

  it("shows the parts as one address with CSS until the browser joins them", () => {
    expect(readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8")).toMatch(/\.email-parts::before\s*\{\s*content: attr\(data-user\) "\\40" attr\(data-domain\);/);
  });

  it("is the only way to write to seed-lab: no GitHub links in either language", () => {
    for (const messages of [{ ...en, ...enPages }, { ...es, ...esPages }]) {
      const text = JSON.stringify(messages);
      expect(text).not.toMatch(/github\.com|\]\(issues\)/i);
      expect(text).toContain("](email)");
    }
  });
});
