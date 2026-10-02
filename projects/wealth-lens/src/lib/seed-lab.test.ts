import { describe, expect, it } from "vitest";
import { hubPath, SEED_LAB_PROJECTS } from "./seed-lab";

describe("seed-lab", () => {
  it("links the hub at the root of the same site, in the page's language", () => {
    expect(hubPath("en")).toBe("/");
    expect(hubPath("es")).toBe("/es/");
  });

  it("lists its projects from the JSON, with Wealth Lens as the current one", () => {
    expect(SEED_LAB_PROJECTS.length).toBeGreaterThanOrEqual(1);
    expect(SEED_LAB_PROJECTS.filter((project) => project.current)).toEqual([{ id: "wealth-lens", name: "Wealth Lens", url: "/", current: true }]);
    expect(new Set(SEED_LAB_PROJECTS.map((project) => project.id)).size).toBe(SEED_LAB_PROJECTS.length);
  });
});
