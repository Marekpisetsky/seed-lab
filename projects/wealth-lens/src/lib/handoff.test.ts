import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "../../../..");
const docs = join(__dirname, "../../docs");
const HANDOFF = /^continuity-(\d{4}-\d{2}-\d{2})\.md$/;

describe("the handoff", () => {
  it("is found by its date: AGENTS.md names the rule, never a fixed file that goes stale", () => {
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
    expect(agents).toContain("continuity-YYYY-MM-DD.md");
    expect(agents).toMatch(/highest date/);
    expect(agents).not.toMatch(/continuity-\d{4}-\d{2}-\d{2}\.md/);
  });

  it("has dated files, so the latest is the one with the highest date", () => {
    const dates = readdirSync(docs).flatMap((name) => HANDOFF.exec(name)?.[1] ?? []);
    expect(dates.length).toBeGreaterThan(0);
    for (const date of dates) expect(Number.isNaN(Date.parse(date)), date).toBe(false);
  });
});
