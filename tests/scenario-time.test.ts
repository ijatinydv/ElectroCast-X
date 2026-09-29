import { describe, expect, it } from "vitest";
import { formatScenarioTime, scenarioTimeAt } from "@/lib/derive";
import type { Scenario } from "@/types/scenario";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";

// permits JSON fixtures to exercise the same typed derivation used by Mission Control
const scenarios = { A: scenarioA as unknown as Scenario, B: scenarioB as unknown as Scenario };

describe("scenario time", () => {
  it("formats negative and positive shared timeline minutes in IST and UTC", () => {
    expect(formatScenarioTime(scenarios.A, -60)).toEqual({ ist: "15:00", utc: "09:30" });
    expect(formatScenarioTime(scenarios.A, 60)).toEqual({ ist: "17:00", utc: "11:30" });
  });

  it("updates deterministically when the active scenario changes", () => {
    expect(scenarioTimeAt(scenarios.A, 0).toISOString()).toBe(scenarioTimeAt(scenarios.B, 0).toISOString());
    expect(formatScenarioTime(scenarios.A, 0).ist).toBe("16:00");
    expect(formatScenarioTime(scenarios.B, 0).ist).toBe("16:00");
  });
});
