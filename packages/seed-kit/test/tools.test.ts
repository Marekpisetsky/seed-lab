import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATEGORIES, PRINCIPLE_IDS, SHOWN_TOOLS, TOOLS, parseTools, toolById } from "../src/tools.ts";

const note = { en: "N", es: "N" };
const tool = {
  id: "t", name: "T", status: "live", category: "money", url: "https://example.org", languages: ["en"],
  tagline: { en: "T", es: "T" }, description: { en: "T", es: "T" },
  principles: Object.fromEntries(PRINCIPLE_IDS.map((id) => [id, { status: "meets", note }])),
};

describe("the list of tools", () => {
  it("is one file, read by the hub and every launcher, with Wealth Lens live", () => {
    assert.equal(toolById("wealth-lens").status, "live");
    assert.ok(SHOWN_TOOLS.some((entry) => entry.id === "wealth-lens"));
    for (const entry of TOOLS) assert.ok(CATEGORIES.includes(entry.category), entry.id);
  });

  it("shows a beta only when it is listed, and never a coming tool", () => {
    assert.equal(parseTools([tool])[0].shown, true);
    assert.equal(parseTools([{ ...tool, status: "beta" }])[0].shown, false);
    assert.equal(parseTools([{ ...tool, status: "beta", listed: false }])[0].shown, false);
    assert.equal(parseTools([{ ...tool, status: "beta", listed: true }])[0].shown, true);
    assert.equal(parseTools([{ ...tool, status: "coming", listed: true }])[0].shown, false);
    for (const entry of TOOLS) assert.equal(SHOWN_TOOLS.includes(entry), entry.status === "live" || (entry.status === "beta" && entry.shown));
  });

  it("refuses a missing language, a bad status or category, an http address, a repeated id", () => {
    assert.throws(() => parseTools([{ ...tool, tagline: { en: "T" } }]), /needs a text in es/);
    assert.throws(() => parseTools([{ ...tool, status: "alpha" }]), /status/);
    assert.throws(() => parseTools([{ ...tool, category: "games" }]), /category/);
    assert.throws(() => parseTools([{ ...tool, url: "http://example.org" }]), /https/);
    assert.throws(() => parseTools([{ ...tool, listed: "yes" }]), /listed/);
    assert.throws(() => parseTools([tool, tool]), /share an id/);
    assert.throws(() => parseTools([{ ...tool, principles: { ...tool.principles, light: { status: "almost", note } } }]), /status for the light principle/);
  });
});
