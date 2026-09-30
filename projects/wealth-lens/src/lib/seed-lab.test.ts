import { describe, expect, it } from "vitest";
import { SEED_LAB_HUB_URL, SEED_LAB_PROJECTS } from "./seed-lab";

describe("seed-lab", () => {
  it("links the hub from one constant", () => {
    expect(SEED_LAB_HUB_URL).toMatch(/^https:\/\//);
  });

  it("lists its projects from the JSON, with Wealth Lens as the current one", () => {
    expect(SEED_LAB_PROJECTS.length).toBeGreaterThanOrEqual(1);
    expect(SEED_LAB_PROJECTS.filter((project) => project.current)).toEqual([{ id: "wealth-lens", name: "Wealth Lens", url: "/", current: true }]);
    expect(new Set(SEED_LAB_PROJECTS.map((project) => project.id)).size).toBe(SEED_LAB_PROJECTS.length);
  });
});
