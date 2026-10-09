import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { goalName } from "@/i18n/goal-text";
import { INITIAL_STATE } from "./app-store";
import { calculate } from "./calculator";
import { parseDataFile, serializeState } from "./data-file";
import { parseGoalItem } from "./validation";

describe("personal priorities", () => {
  const freedom = { id: "freedom", kind: "freedom" as const, amount: 1200, country: null, important: true as const };
  const plan = { ...INITIAL_STATE.plan, invested: 60_000, monthlyContribution: 500, withdrawalRate: 0.04, goals: [freedom] };

  it("uses personal expenses, not an arbitrary generic target: EUR 1,200/month at 4% needs EUR 360,000", () => {
    const status = calculate(plan, new Date("2026-10-05")).goals[0];
    expect(status).toMatchObject({ known: true, kind: "monthly", amount: 1200, target: 360_000 });
    expect(status.months).toBeGreaterThan(0);
    expect(goalName(status, EN)).toBe("Live without working");
    expect(goalName(status, getI18n("es"))).toBe("Vivir sin trabajar");
    const at3 = calculate({ ...plan, withdrawalRate: 0.03 }, new Date()).goals[0];
    expect(at3.target).toBe(480_000);
    expect(at3.months).toBeGreaterThan(status.months);
  });

  it("recognises an already funded goal and an unreachable one", () => {
    expect(calculate({ ...plan, invested: 360_000 }, new Date()).goals[0].months).toBe(0);
    const unreachable = calculate({ ...plan, invested: 0, monthlyContribution: 0 }, new Date()).goals[0];
    expect(unreachable).toMatchObject({ reachable: false, months: Infinity });
  });

  it("round-trips priorities, personal names and a country estimate in the local data file", () => {
    const goals = [freedom, { ...freedom, id: "country", country: "ES", estimateDate: "2026-09" }, { id: "own", kind: "amount" as const, amount: 6000, label: "My studio", important: true as const }];
    const state = { ...INITIAL_STATE, plan: { ...plan, goals } };
    expect(parseDataFile(serializeState(state, new Date()))).toMatchObject({ ok: true, state });
  });

  it("rejects invalid expenses and malformed priority flags", () => {
    for (const amount of [0, -10, Infinity, "1200"]) expect(parseGoalItem({ ...freedom, amount })).toBeNull();
    expect(parseGoalItem({ ...freedom, important: "yes" })).toBeNull();
    expect(parseGoalItem({ ...freedom, country: "BAD" })).toBeNull();
    expect(parseGoalItem({ ...freedom, country: "ES", estimateDate: "not a date" })).toBeNull();
    expect(parseGoalItem({ ...freedom, country: "ES", estimateDate: "2026-99" })).toBeNull();
  });

  it("keeps unnamed old goals valid without adding a priority", () => {
    expect(parseGoalItem({ id: "old", kind: "amount", amount: 600 })).toEqual({ id: "old", kind: "amount", amount: 600 });
  });
});
