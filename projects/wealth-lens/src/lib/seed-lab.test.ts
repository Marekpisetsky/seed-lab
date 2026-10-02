import { describe, expect, it } from "vitest";
import { SEED_LAB_HUB_URL, SHOWN_TOOLS, toolById } from "./seed-lab";

describe("seed-lab", () => {
  it("links the hub from one constant", () => {
    expect(SEED_LAB_HUB_URL).toMatch(/^https:\/\//);
  });

  it("is a live tool of seed-kit's list, shown in every launcher", () => {
    expect(toolById("wealth-lens")).toMatchObject({ name: "Wealth Lens", status: "live", shown: true, category: "money" });
    expect(SHOWN_TOOLS.map((tool) => tool.id)).toContain("wealth-lens");
  });
});
