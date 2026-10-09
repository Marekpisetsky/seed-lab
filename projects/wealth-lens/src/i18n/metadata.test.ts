import { describe, expect, it } from "vitest";
import { pageMetadata } from "./metadata";

describe("the app's languages", () => {
  it("are seed-kit's, so the header, the language script and these pages agree on which are shown", async () => {
    const kit = await import("@seed-kit/locales.ts");
    const app = await import("./locales");
    expect(app.LOCALES).toEqual(kit.LOCALES);
    expect(app.SHOWN_LOCALES).toEqual(["en", "es"]);
  });
});

describe("each page's metadata", () => {
  it("links the shown languages only, and keeps Dutch out of search until a native speaker has reviewed it", () => {
    const english = pageMetadata("en", "money");
    expect(Object.keys(english.alternates?.languages ?? {})).toEqual(["en-US", "es-ES", "x-default"]);
    expect(english.robots).toBeUndefined();
    const dutch = pageMetadata("nl", "test");
    expect(dutch.robots).toEqual({ index: false });
    expect(dutch.alternates).toBeUndefined();
  });
});
