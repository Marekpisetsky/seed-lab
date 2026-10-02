import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const template = readFileSync(new URL("./deploy.workflow.yml", import.meta.url), "utf8");
/** The copy GitHub runs, at the root of the repository. */
const installed = fileURLToPath(new URL("../.github/workflows/deploy.yml", import.meta.url));
const prices = readFileSync(new URL("../projects/wealth-lens/scripts/update-prices.workflow.yml", import.meta.url), "utf8");

describe("the deploy workflow", () => {
  it("uses the v5 actions", () => {
    assert.match(template, /uses: actions\/checkout@v5\b/);
    assert.match(template, /uses: actions\/setup-node@v5\b/);
    assert.doesNotMatch(template, /@v[1-4]\b/);
  });

  it("runs on pushes to master and after the daily prices, by the prices workflow's own name", () => {
    assert.match(template, /push:\n\s+branches: \[master\]/);
    const name = prices.match(/^name: (.+)$/m)?.[1];
    assert.equal(name, "Update prices");
    assert.match(template, new RegExp(`workflow_run:\\n\\s+workflows: \\[${name}\\]`));
  });

  it("publishes the combined, checked site to the deploy branch, with no build on statichost.eu", () => {
    assert.match(template, /node deploy\/combine\.mjs _site/);
    assert.match(template, /git push -q --force "\$remote" deploy/);
    assert.match(template, /builder\.statichost\.eu\/\$\{SITE\}/);
  });

  it("is the same as the copy GitHub runs, when the repository has it", () => {
    if (!existsSync(installed)) return;
    assert.equal(readFileSync(installed, "utf8"), template);
  });
});
