import { describe, expect, it } from "vitest";
import { corridorSummaryFor, effectiveSensorMask } from "@/lib/derive";
import { frameAt } from "@/lib/map/interpolate";
import type { Scenario } from "@/types/scenario";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";

// returns the current prepared cell and sensor state without component-owned forecast copies
function preparedCell(scenario: Scenario, timeMin: number) {
  const frame = frameAt(scenario, timeMin);
  const cell = frame.cells[0];
  if (!cell) throw new Error("Prepared scenario requires one current cell");
  return { cell, frame };
}

describe("corridor summary", () => {
  it("derives arrival, motion, direction, and width for a first-lightning cell", () => {
    const { cell, frame } = preparedCell(scenarioA as unknown as Scenario, 0);
    const summary = corridorSummaryFor(cell, 30, effectiveSensorMask({ radar: false, insat: false, lightning: false, nwp: false }, frame.sensorHealth), frame.sensorHealth);
    expect(summary).toMatchObject({ speedKmh: cell.motion.speedKmh, directionDeg: cell.motion.dirDeg });
    expect(summary.arrivalMin).toBeGreaterThan(0);
    expect(summary.widthKm).toBeGreaterThan(0);
  });

  it("derives the active-storm corridor from its prepared motion", () => {
    const { cell, frame } = preparedCell(scenarioB as unknown as Scenario, 0);
    const summary = corridorSummaryFor(cell, 30, effectiveSensorMask({ radar: false, insat: false, lightning: false, nwp: false }, frame.sensorHealth), frame.sensorHealth);
    expect(summary.speedKmh).toBe(cell.motion.speedKmh);
    expect(summary.arrivalMin).toBeGreaterThan(0);
  });

  it("widens the summary when current sensors are degraded", () => {
    const { cell, frame } = preparedCell(scenarioC as unknown as Scenario, 0);
    const clear = corridorSummaryFor(cell, 30, { radar: false, insat: false, lightning: false, nwp: false }, { ...frame.sensorHealth, radar: { status: "online", dataAgeMin: 1 } });
    const degraded = corridorSummaryFor(cell, 30, effectiveSensorMask({ radar: false, insat: false, lightning: false, nwp: false }, frame.sensorHealth), frame.sensorHealth);
    expect(degraded.widthKm).toBeGreaterThan(clear.widthKm);
  });
});
