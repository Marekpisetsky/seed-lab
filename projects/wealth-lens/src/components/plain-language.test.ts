import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { JARGON, hasJargon, plainLanguageProblems } from "@seed-kit/plain-language.ts";
import { getI18n } from "@/i18n";
import { LOCALES } from "@/i18n/locales";
import { connectionsData } from "@/lib/connections";

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
