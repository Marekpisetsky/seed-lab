/**
 * The tools and the planned building blocks. The tools are seed-kit's one
 * list (packages/seed-kit/src/tools.json), the same one every app's
 * launcher reads; the blocks are the hub's own, in content/blocks.json:
 * add a block there, not in the pages. Validated when the build starts,
 * so a bad edit stops the build instead of publishing a broken page.
 */

import blocksJson from "../content/blocks.json" with { type: "json" };
import { https, localized } from "../../packages/seed-kit/src/tools.ts";
import type { Localized } from "../../packages/seed-kit/src/locales.ts";

export { COMPLIANCE, PRINCIPLE_IDS, SHOWN_TOOLS, TOOLS, toolById } from "../../packages/seed-kit/src/tools.ts";
export type { Compliance, PrincipleId, Status, Tool } from "../../packages/seed-kit/src/tools.ts";

/** "live": people can use it today. "coming": it does not exist yet as its own thing. */
export type BlockStatus = "live" | "coming";

export interface Block {
  id: string;
  status: BlockStatus;
  /** Where it is published. Required to be "live": a block without one does not exist yet. */
  url?: string;
  name: Localized;
  text: Localized;
}

function fail(message: string): never {
  throw new Error(`content: ${message}`);
}

export function parseBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) fail("blocks.json must be a list");
  return value.map((entry: Record<string, unknown>, index) => {
    const where = `block ${typeof entry.id === "string" ? entry.id : index}`;
    if (typeof entry.id !== "string") fail(`${where} needs an id`);
    if (entry.status !== "live" && entry.status !== "coming") fail(`${where}: status must be "live" or "coming"`);
    if (entry.status === "live" && entry.url === undefined) fail(`${where} can only be "live" with the address where it is published`);
    return {
      id: entry.id,
      status: entry.status,
      ...(entry.url === undefined ? {} : { url: https(entry.url, where) }),
      name: localized(entry.name, `${where} name`),
      text: localized(entry.text, `${where} text`),
    };
  });
}

export const BLOCKS: readonly Block[] = parseBlocks(blocksJson);
