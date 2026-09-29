import { beforeEach, describe, expect, it } from "vitest";
import A from "@/data/scenarios/a-first-flash.json";
import B from "@/data/scenarios/b-severe-storm.json";
import C from "@/data/scenarios/c-sensor-loss.json";
import { getSyntheticAssets } from "@/lib/geo/load";
import { countdownFor, corridorFor, effectiveSensorMask, exposureFor, maskBits, riskFor, widthScale } from "@/lib/derive";
import { useStore } from "@/store/useStore";
import { frameAt } from "@/lib/map/interpolate";
import type { Scenario, SensorId } from "@/types/scenario";

const firstFlash = A as unknown as Scenario;
const severeStorm = B as unknown as Scenario;
const sensorLoss = C as unknown as Scenario;
const allSensors: SensorId[] = ["radar", "insat", "lightning", "nwp"];

// retrieves the contract's T0 cell so derive tests share one source of fixture truth
function t0Cell(scenario: Scenario) {
  const cell = scenario.frames.find((frame) => frame.t === 0)?.cells[0];
  if (!cell) throw new Error("Missing T0 cell");
  return cell;
}

// computes polygon area for nesting assertions without adding geometry dependencies
function area(polygon: [number, number][]): number {
  return Math.abs(polygon.reduce((total, point, index) => {
    const next = polygon[(index + 1) % polygon.length]!;
    return total + point[0] * next[1] - next[0] * point[1];
  }, 0)) / 2;
}

describe("derive functions", () => {
  it("maps disabled sensors to documented bit positions", () => {
    expect(maskBits({ radar: true })).toBe(1);
    expect(maskBits({ insat: true })).toBe(2);
    expect(maskBits({ lightning: true })).toBe(4);
    expect(maskBits({ nwp: true })).toBe(8);
    expect(maskBits({ radar: true, insat: true, lightning: true, nwp: true })).toBe(15);
  });

  it("returns canonical risks and remains monotonic for all sensor masks", () => {
    const firstCell = t0Cell(firstFlash);
    const severeCell = t0Cell(severeStorm);
    expect([{}, { radar: true }, { insat: true }, { nwp: true }].map((mask) => riskFor(firstFlash, firstCell.id, mask))).toEqual([71, 46, 63, 67]);
    expect([{}, { radar: true }, { insat: true }, { nwp: true }].map((mask) => riskFor(severeStorm, severeCell.id, mask))).toEqual([78, 51, 69, 73]);
    for (const scenario of [firstFlash, severeStorm]) {
      const cell = t0Cell(scenario);
      for (let mask = 0; mask < 16; mask += 1) {
        for (const sensor of allSensors) {
          const bit = maskBits({ [sensor]: true });
          if ((mask & bit) === 0) {
            const current = riskFor(scenario, cell.id, Object.fromEntries(allSensors.map((id) => [id, Boolean(mask & maskBits({ [id]: true }))])));
            const disabled = riskFor(scenario, cell.id, Object.fromEntries(allSensors.map((id) => [id, Boolean((mask | bit) & maskBits({ [id]: true }))])));
            expect(disabled).toBeLessThanOrEqual(current);
          }
        }
      }
    }
  });

  it("rescales countdown horizons while preserving the authoritative masked p30 risk", () => {
    const cell = t0Cell(firstFlash);
    for (let mask = 0; mask < 16; mask += 1) {
      const sensors = Object.fromEntries(allSensors.map((sensor) => [sensor, Boolean(mask & maskBits({ [sensor]: true }))]));
      const countdown = countdownFor(firstFlash, cell.id, sensors);
      expect(countdown.p15).toBeLessThanOrEqual(countdown.p30);
      expect(countdown.p30).toBeLessThanOrEqual(countdown.p60);
      expect(countdown.p30).toBe(riskFor(firstFlash, cell.id, sensors));
    }
  });

  it("keeps the selected Scenario A cell aligned with the canonical countdown at t=0", () => {
    const cell = frameAt(firstFlash, 0).cells.find((candidate) => candidate.id === "C-A07");
    if (!cell) throw new Error("Scenario A requires C-A07 at t=0");
    const countdown = countdownFor(firstFlash, cell.id, {});
    expect([countdown.p15, countdown.p30, countdown.p60]).toEqual([42, 71, 89]);
    expect(countdown.windowMin).toEqual([18, 27]);
    expect(countdown.confidence).toBe("Moderate");
  });

  it("widens nested corridors according to sensor uncertainty", () => {
    const cell = t0Cell(firstFlash);
    const standard = corridorFor(cell, 30, 1);
    const degraded = corridorFor(cell, 30, 1.35);
    expect(area(standard.center)).toBeLessThan(area(standard.inner));
    expect(area(standard.inner)).toBeLessThan(area(standard.outer));
    expect(area(degraded.inner)).toBeGreaterThan(area(standard.inner));
    expect(area(degraded.outer)).toBeGreaterThan(area(standard.outer));
  });

  it("maps sensor disablement and stale observations to the documented corridor scale", () => {
    const t0Frame = firstFlash.frames.find((frame) => frame.t === 0);
    if (!t0Frame) throw new Error("Scenario A requires a t=0 frame");
    const { sensorHealth } = t0Frame;
    expect(widthScale({ radar: true, insat: false, lightning: false, nwp: false }, sensorHealth)).toBeGreaterThanOrEqual(1.35);
    expect(widthScale({ radar: false, insat: false, lightning: false, nwp: false }, { ...sensorHealth, radar: { ...sensorHealth.radar, dataAgeMin: 40 } })).toBe(1.25);
  });

  // ensures the prepared sensor-loss narrative widens forecast uncertainty without an operator action
  it("includes offline prepared sensors in the effective uncertainty mask", () => {
    const forecastFrame = sensorLoss.frames.find((frame) => frame.t === 30);
    if (!forecastFrame) throw new Error("Scenario C requires a +30 minute frame");
    const mask = effectiveSensorMask({ radar: false, insat: false, lightning: false, nwp: false }, forecastFrame.sensorHealth);
    expect(mask.radar).toBe(true);
    expect(widthScale(mask, forecastFrame.sensorHealth)).toBeGreaterThan(1.35);
  });

  it("returns the documented severe-storm synthetic exposure and arrival", () => {
    const cell = t0Cell(severeStorm);
    expect(exposureFor(corridorFor(cell, 30, 1), getSyntheticAssets(), cell)).toMatchObject({ villages: 3, schools: 2, transmission: 1, arrivalMin: 24 });
  });

  it("keeps exposure counts nested as the selected horizon expands", () => {
    const cell = t0Cell(severeStorm);
    const counts = [
      exposureFor(corridorFor(cell, 15, 1), getSyntheticAssets(), cell),
      exposureFor(corridorFor(cell, 30, 1), getSyntheticAssets(), cell),
      exposureFor(corridorFor(cell, 60, 1), getSyntheticAssets(), cell),
    ] as const;
    for (const type of ["villages", "schools", "hospitals", "transmission"] as const) {
      expect(counts[0][type]).toBeLessThanOrEqual(counts[1][type]);
      expect(counts[1][type]).toBeLessThanOrEqual(counts[2][type]);
    }
  });
});

describe("store", () => {
  beforeEach(() => useStore.getState().selectScenario("A"));

  it("resets scenario-bound controls on scenario selection", () => {
    const store = useStore.getState();
    store.setTime(48);
    store.selectCell("C-A07");
    store.toggleSensor("radar");
    store.issueWarning({ tMin: 48, cellId: "C-A07", horizon: 30 });
    store.selectScenario("B");
    expect(useStore.getState()).toMatchObject({ scenarioId: "B", timeMin: 0, selectedCellId: null, sensorOff: { radar: false, insat: false, lightning: false, nwp: false }, issuedWarnings: [] });
  });

  it("increments highlights so selecting an asset twice pulses it twice", () => {
    const store = useStore.getState();
    store.highlightAsset("village-021");
    expect(useStore.getState().highlight).toEqual({ assetId: "village-021", sequence: 1 });
    useStore.getState().highlightAsset("village-021");
    expect(useStore.getState().highlight).toEqual({ assetId: "village-021", sequence: 2 });
  });
});
