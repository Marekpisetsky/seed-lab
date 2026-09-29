import { afterEach, describe, expect, it, vi } from "vitest";
import { createId } from "./id";

describe("createId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses crypto.randomUUID when available", () => {
    expect(createId()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("falls back to a time + random id outside secure contexts", () => {
    vi.stubGlobal("crypto", {});
    const ids = new Set(Array.from({ length: 100 }, createId));
    expect(ids.size).toBe(100);
    expect([...ids][0]).toMatch(/^[0-9a-z]+-[0-9a-z]+$/);
  });
});
