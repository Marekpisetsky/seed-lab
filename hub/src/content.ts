/**
 * The tools and the planned building blocks, from content/*.json: add a
 * tool or a block there, not in the pages. Each tool says how it meets
 * each principle. Validated when the build starts, so a bad edit stops the
 * build instead of publishing a broken page.
 */

import blocksJson from "../content/blocks.json" with { type: "json" };
import toolsJson from "../content/tools.json" with { type: "json" };
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./i18n/locales.ts";

/** "live": people can use it today. "coming": it does not exist yet as its own thing. */
export type Status = "live" | "coming";
export type Localized = Readonly<Record<Locale, string>>;

/** The five principles, in the order of the Principles page (the dictionaries use the same ids). */
export const PRINCIPLE_IDS = ["device", "transparent", "europe", "light", "everyone"] as const;
export type PrincipleId = (typeof PRINCIPLE_IDS)[number];
/**
 * How a product meets a principle's rules today. "progress": the change
 * that meets it is ready and under way, not yet in effect.
 */
export type Compliance = "meets" | "progress" | "partly" | "pending";
export const COMPLIANCE: readonly Compliance[] = ["meets", "progress", "partly", "pending"];

export interface Tool {
  id: string;
  name: string;
  status: Status;
  /** "https://…" elsewhere, or its folder on this same site, "/wealth-lens/". */
  url: string;
  languages: Locale[];
  tagline: Localized;
  description: Localized;
  principles: Readonly<Record<PrincipleId, { status: Compliance; note: Localized }>>;
}

export interface Block {
  id: string;
  status: Status;
  /** Where it is published. Required to be "live": a block without one does not exist yet. */
  url?: string;
  name: Localized;
  text: Localized;
}

function fail(message: string): never {
  throw new Error(`content: ${message}`);
}

function localized(value: unknown, where: string): Localized {
  const entry = value as Record<string, unknown> | undefined;
  for (const locale of LOCALES) {
    if (typeof entry?.[locale] !== "string" || entry[locale] === "") fail(`${where} needs a text in ${locale}`);
  }
  return entry as Localized;
}

function status(value: unknown, where: string): Status {
  if (value !== "live" && value !== "coming") fail(`${where}: status must be "live" or "coming"`);
  return value;
}

function https(value: unknown, where: string): string {
  if (typeof value !== "string" || !value.startsWith("https://")) fail(`${where} needs an https address`);
  return value;
}

/** A tool's address: an https one, or a folder of this same site ("/wealth-lens/"). */
function address(value: unknown, where: string): string {
  if (typeof value === "string" && /^\/[a-z0-9-]+\/$/.test(value)) return value;
  return https(value, where);
}

function compliance(value: unknown, where: string): Tool["principles"] {
  const entries = (value ?? {}) as Record<string, { status?: unknown; note?: unknown } | undefined>;
  const unknown = Object.keys(entries).filter((id) => !(PRINCIPLE_IDS as readonly string[]).includes(id));
  if (unknown.length > 0) fail(`${where}: unknown principles ${unknown.join(", ")}`);
  return Object.fromEntries(
    PRINCIPLE_IDS.map((id) => {
      const entry = entries[id];
      if (!entry || !(COMPLIANCE as readonly unknown[]).includes(entry.status)) fail(`${where} needs a status for the ${id} principle: meets, progress, partly or pending`);
      return [id, { status: entry.status as Compliance, note: localized(entry.note, `${where} ${id} note`) }];
    }),
  ) as Tool["principles"];
}

export function parseTools(value: unknown): Tool[] {
  if (!Array.isArray(value) || value.length === 0) fail("tools.json must list at least one tool");
  return value.map((entry: Record<string, unknown>, index) => {
    const where = `tool ${typeof entry.id === "string" ? entry.id : index}`;
    if (typeof entry.id !== "string" || typeof entry.name !== "string") fail(`${where} needs an id and a name`);
    const languages = entry.languages;
    if (!Array.isArray(languages) || languages.length === 0 || !languages.every((locale) => (LOCALES as readonly unknown[]).includes(locale))) {
      fail(`${where} needs its languages`);
    }
    return {
      id: entry.id,
      name: entry.name,
      status: status(entry.status, where),
      url: address(entry.url, where),
      languages: languages as Locale[],
      tagline: localized(entry.tagline, `${where} tagline`),
      description: localized(entry.description, `${where} description`),
      principles: compliance(entry.principles, where),
    };
  });
}

export function parseBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) fail("blocks.json must be a list");
  return value.map((entry: Record<string, unknown>, index) => {
    const where = `block ${typeof entry.id === "string" ? entry.id : index}`;
    if (typeof entry.id !== "string") fail(`${where} needs an id`);
    const state = status(entry.status, where);
    if (state === "live" && entry.url === undefined) fail(`${where} can only be "live" with the address where it is published`);
    return {
      id: entry.id,
      status: state,
      ...(entry.url === undefined ? {} : { url: https(entry.url, where) }),
      name: localized(entry.name, `${where} name`),
      text: localized(entry.text, `${where} text`),
    };
  });
}

/**
 * Where a link to a tool goes from a page in `locale`: a tool of this site
 * that speaks that language opens in it, in its own folder
 * ("/wealth-lens/es/", as the hub's pages do); any other address as is.
 */
export function toolHref(tool: Pick<Tool, "url" | "languages">, locale: Locale): string {
  if (!tool.url.startsWith("/") || locale === DEFAULT_LOCALE || !tool.languages.includes(locale)) return tool.url;
  return `${tool.url}${locale}/`;
}

export const TOOLS: readonly Tool[] = parseTools(toolsJson);
export const BLOCKS: readonly Block[] = parseBlocks(blocksJson);
