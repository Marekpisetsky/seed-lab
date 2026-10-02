/**
 * seed-lab's tools, from tools.json: the one list the hub's pages and every
 * app's launcher read. Add a tool there, not in an app. Each tool says how
 * it meets each principle. Checked when it is read, so a bad edit stops
 * the build instead of publishing a broken page.
 */

import toolsJson from "./tools.json" with { type: "json" };
import { LOCALES, type Locale, type Localized } from "./locales.ts";

/**
 * "live": people can use it today, and it is shown everywhere.
 * "beta": it works and is published, but it is only shown (hub, launcher)
 * when "listed" is true; by default it is not.
 * "coming": it does not exist yet as its own thing.
 */
export type Status = "live" | "beta" | "coming";
export const STATUSES: readonly Status[] = ["live", "beta", "coming"];

/** The shelves of the hub, in this order. */
export const CATEGORIES = ["money", "life"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_NAMES: Readonly<Record<Category, Localized>> = {
  money: { en: "Money", es: "Dinero" },
  life: { en: "Life and countries", es: "Vida y países" },
};

/** The five principles, in the order of the Principles page (the dictionaries use the same ids). */
export const PRINCIPLE_IDS = ["device", "transparent", "europe", "light", "everyone"] as const;
export type PrincipleId = (typeof PRINCIPLE_IDS)[number];
/** How a product meets a principle's rules today. */
export type Compliance = "meets" | "partly" | "pending";
export const COMPLIANCE: readonly Compliance[] = ["meets", "partly", "pending"];

export interface Tool {
  id: string;
  name: string;
  status: Status;
  /** Shown on the hub and in the launchers. Live tools always are; a beta only when its "listed" is true. */
  shown: boolean;
  category: Category;
  url: string;
  languages: Locale[];
  tagline: Localized;
  description: Localized;
  principles: Readonly<Record<PrincipleId, { status: Compliance; note: Localized }>>;
}

function fail(message: string): never {
  throw new Error(`tools.json: ${message}`);
}

export function localized(value: unknown, where: string): Localized {
  const entry = value as Record<string, unknown> | undefined;
  for (const locale of LOCALES) {
    if (typeof entry?.[locale] !== "string" || entry[locale] === "") fail(`${where} needs a text in ${locale}`);
  }
  return entry as Localized;
}

export function https(value: unknown, where: string): string {
  if (typeof value !== "string" || !value.startsWith("https://")) fail(`${where} needs an https address`);
  return value;
}

function compliance(value: unknown, where: string): Tool["principles"] {
  const entries = (value ?? {}) as Record<string, { status?: unknown; note?: unknown } | undefined>;
  const unknown = Object.keys(entries).filter((id) => !(PRINCIPLE_IDS as readonly string[]).includes(id));
  if (unknown.length > 0) fail(`${where}: unknown principles ${unknown.join(", ")}`);
  return Object.fromEntries(
    PRINCIPLE_IDS.map((id) => {
      const entry = entries[id];
      if (!entry || !(COMPLIANCE as readonly unknown[]).includes(entry.status)) fail(`${where} needs a status for the ${id} principle: meets, partly or pending`);
      return [id, { status: entry.status as Compliance, note: localized(entry.note, `${where} ${id} note`) }];
    }),
  ) as Tool["principles"];
}

export function parseTools(value: unknown): Tool[] {
  if (!Array.isArray(value) || value.length === 0) fail("it must list at least one tool");
  const tools = value.map((entry: Record<string, unknown>, index) => {
    const where = `tool ${typeof entry.id === "string" ? entry.id : index}`;
    if (typeof entry.id !== "string" || !/^[a-z0-9-]+$/.test(entry.id) || typeof entry.name !== "string") fail(`${where} needs an id (a-z, 0-9, -) and a name`);
    if (!(STATUSES as readonly unknown[]).includes(entry.status)) fail(`${where}: status must be "live", "beta" or "coming"`);
    if (entry.listed !== undefined && typeof entry.listed !== "boolean") fail(`${where}: listed must be true or false`);
    if (!(CATEGORIES as readonly unknown[]).includes(entry.category)) fail(`${where}: category must be ${CATEGORIES.join(" or ")}`);
    const languages = entry.languages;
    if (!Array.isArray(languages) || languages.length === 0 || !languages.every((locale) => (LOCALES as readonly unknown[]).includes(locale))) {
      fail(`${where} needs its languages`);
    }
    const status = entry.status as Status;
    return {
      id: entry.id,
      name: entry.name,
      status,
      shown: status === "live" || (status === "beta" && entry.listed === true),
      category: entry.category as Category,
      url: https(entry.url, where),
      languages: languages as Locale[],
      tagline: localized(entry.tagline, `${where} tagline`),
      description: localized(entry.description, `${where} description`),
      principles: compliance(entry.principles, where),
    };
  });
  const ids = tools.map((tool) => tool.id);
  if (new Set(ids).size !== ids.length) fail("two tools share an id");
  return tools;
}

export const TOOLS: readonly Tool[] = parseTools(toolsJson);

/** The tools people see: live ones, and betas marked "listed". */
export const SHOWN_TOOLS: readonly Tool[] = TOOLS.filter((tool) => tool.shown);

export function toolById(id: string): Tool {
  const tool = TOOLS.find((entry) => entry.id === id);
  if (!tool) throw new Error(`tools.json has no tool "${id}"`);
  return tool;
}
