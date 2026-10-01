/**
 * The tools and the building blocks, from content/*.json: add a tool or a
 * block there, not in the pages. Validated when the build starts, so a bad
 * edit stops the build instead of publishing a broken card.
 */

import blocksJson from "../content/blocks.json" with { type: "json" };
import toolsJson from "../content/tools.json" with { type: "json" };
import { LOCALES, type Locale } from "./i18n/locales.ts";

/** "live": people can use it today. "coming": it does not exist yet as its own thing. */
export type Status = "live" | "coming";
export type Localized = Readonly<Record<Locale, string>>;

export interface Tool {
  id: string;
  name: string;
  status: Status;
  url: string;
  languages: Locale[];
  tagline: Localized;
  description: Localized;
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
      url: https(entry.url, where),
      languages: languages as Locale[],
      tagline: localized(entry.tagline, `${where} tagline`),
      description: localized(entry.description, `${where} description`),
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

export const TOOLS: readonly Tool[] = parseTools(toolsJson);
export const BLOCKS: readonly Block[] = parseBlocks(blocksJson);
