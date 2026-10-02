/**
 * A static tool's code for the browser, without a bundler: from the page's
 * entry module, every module it imports (the tool's and the kit's), with
 * the types taken out by Node itself (`stripTypeScriptTypes`), the ".ts"
 * imports pointing at the ".js" files written next to them, and JSON
 * files turned into modules. Each source folder goes to its own output
 * folder ({ "js": toolSrc, "js/kit": kitSrc }), keeping its layout, so
 * the kit's relative imports still work.
 *
 * Only erasable TypeScript, as the kit and the tools already are: no
 * enums, namespaces or parameter properties.
 */

import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { dirname, posix, relative, resolve, sep } from "node:path";

export interface BrowserModule {
  /** Where it goes on the site, from the site's root: "js/app.js". */
  path: string;
  code: string;
}

const IMPORT = /(\b(?:import|export)\b[^;"'`]*?\bfrom\s*|\bimport\s*\(?\s*)(["'])(\.{1,2}\/[^"']+)\2(\s*with\s*\{[^}]*\})?/g;

/** Node warns that stripTypeScriptTypes is experimental; the build does not need to say it each time. */
function strip(code: string): string {
  const warn = process.emitWarning;
  process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
    if (String(warning).includes("stripTypeScriptTypes")) return;
    (warn as (...args: unknown[]) => void).call(process, warning, ...rest);
  }) as typeof process.emitWarning;
  try {
    return stripTypeScriptTypes(code, { mode: "strip" });
  } finally {
    process.emitWarning = warn;
  }
}

/** Without doc comments, comment lines and the blanks stripping leaves: less to download. */
function tidy(code: string): string {
  return code
    .replace(/^[ \t]*\/\*\*[\s\S]*?\*\/[ \t]*$/gm, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim()
    .concat("\n");
}

/**
 * The modules a page needs, from its entry file. `folders` says where each
 * source folder goes on the site; a module outside all of them stops the
 * build (it would not be published).
 */
export function browserModules(entry: string, folders: Readonly<Record<string, string>>): BrowserModule[] {
  const roots = Object.entries(folders)
    .map(([out, dir]) => ({ out, dir: resolve(dir) }))
    .sort((a, b) => b.dir.length - a.dir.length);
  const outPath = (file: string) => {
    const root = roots.find(({ dir }) => file === dir || file.startsWith(dir + sep));
    if (!root) throw new Error(`browser: ${file} is outside the folders it can publish`);
    const inside = relative(root.dir, file).split(sep).join("/");
    return posix.join(root.out, inside.replace(/\.ts$/, ".js").replace(/\.json$/, ".json.js"));
  };
  const modules = new Map<string, BrowserModule>();
  const queue = [resolve(entry)];
  while (queue.length > 0) {
    const file = queue.shift() as string;
    const path = outPath(file);
    if (modules.has(path)) continue;
    const source = readFileSync(file, "utf8");
    if (file.endsWith(".json")) {
      modules.set(path, { path, code: `export default ${JSON.stringify(JSON.parse(source))};\n` });
      continue;
    }
    const code = tidy(strip(source)).replace(IMPORT, (_match, before: string, quote: string, specifier: string) => {
      const target = resolve(dirname(file), specifier);
      queue.push(target);
      let link = posix.relative(posix.dirname(path), outPath(target));
      if (!link.startsWith(".")) link = `./${link}`;
      return `${before}${quote}${link}${quote}`;
    });
    modules.set(path, { path, code });
  }
  return [...modules.values()];
}
