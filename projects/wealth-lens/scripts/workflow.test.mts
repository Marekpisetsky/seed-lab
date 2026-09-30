import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const template = readFileSync(fileURLToPath(new URL("./update-prices.workflow.yml", import.meta.url)), "utf8");
/** The copy GitHub runs, at the root of the seed-lab repository. */
const installed = fileURLToPath(new URL("../../../.github/workflows/update-prices.yml", import.meta.url));

describe("the daily prices workflow", () => {
  it("uses the current major versions of its actions", () => {
    expect(template).toMatch(/uses: actions\/checkout@v5\b/);
    expect(template).toMatch(/uses: actions\/setup-node@v5\b/);
    expect(template).not.toMatch(/@v[1-4]\b/);
  });

  it("is the same as the copy GitHub runs, when the repository has it", () => {
    if (!existsSync(installed)) return;
    expect(readFileSync(installed, "utf8")).toBe(template);
  });
});
