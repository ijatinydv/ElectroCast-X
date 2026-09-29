import { describe, expect, it } from "vitest";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import { outcomeSummaryFor } from "@/lib/derive";
import type { Scenario } from "@/types/scenario";

// verifies the comparison statement stays derived from the prepared forecast and outcome fields
describe("outcome summary", () => {
  it("relates Scenario A's first flash to its issued window and forecast region", () => {
    expect(outcomeSummaryFor(scenarioA as unknown as Scenario)).toEqual({
      firstFlashMin: 25,
      windowMin: [18, 27],
      insidePrediction: true,
    });
  });
});
