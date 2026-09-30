import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Words a normal person should never have to read on the screen. They may
 * stay in the folded "i" explanations, which live in explainers.tsx.
 */
const JARGON = /\b(real|nominal|volatility|volatile|swings?|swung|percentiles?)\b/i;

const SRC = fileURLToPath(new URL("..", import.meta.url));
/** The folded "i" explanations: the one place the words above may appear. */
const EXPLAINERS = "components/money/explainers.tsx";
/** Attributes that never show text. */
const HIDDEN_ATTRIBUTES = new Set(["className", "id", "key", "type", "role", "href", "htmlFor", "name", "rel", "target", "d", "viewBox", "fill", "stroke"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/** Text a file can put on the screen: JSX text, text attributes, and every string with a space in it. */
function visibleTexts(path: string): string[] {
  const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const texts: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    // A thrown error is for developers: the app never shows it.
    if (ts.isThrowStatement(node)) return;
    if (ts.isJsxAttribute(node) && HIDDEN_ATTRIBUTES.has(node.name.getText(file))) return;
    if (ts.isJsxText(node)) {
      if (node.text.trim()) texts.push(node.text.trim());
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      if (/\s/.test(node.text) || ts.isJsxAttribute(node.parent)) texts.push(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return texts;
}

const files = [...sourceFiles(join(SRC, "components")), ...sourceFiles(join(SRC, "app")), ...sourceFiles(join(SRC, "hooks")), ...sourceFiles(join(SRC, "lib"))];

describe("plain language", () => {
  it("finds the texts of the components and of the code that writes them", () => {
    const all = files.flatMap(visibleTexts);
    expect(files.some((path) => path.endsWith("assumptions-panel.tsx"))).toBe(true);
    expect(all).toContain("How much it grows a year");
    expect(all.length).toBeGreaterThan(300);
  });

  it("never shows real, nominal, volatility, swings or percentile outside the folded explanations", () => {
    const found = files
      .filter((path) => relative(SRC, path) !== EXPLAINERS)
      .flatMap((path) => visibleTexts(path).filter((text) => JARGON.test(text)).map((text) => `${relative(SRC, path)}: ${text}`));
    expect(found).toEqual([]);
  });

  it("would catch them", () => {
    expect(JARGON.test("Growth a year, after inflation (real)")).toBe(true);
    expect(JARGON.test("big swings")).toBe(true);
    expect(JARGON.test("the 10th percentile")).toBe(true);
    expect(JARGON.test("what your money can really buy")).toBe(false);
  });
});
