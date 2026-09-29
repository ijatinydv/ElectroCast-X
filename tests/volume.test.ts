import { describe, expect, it } from "vitest";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import { buildVolume, volumeCoreFor, VOLUME_DEPTH, VOLUME_WIDTH } from "@/lib/derive/volume";
import type { Scenario } from "@/types/scenario";

// supplies a prepared developing cell that exercises the procedural storm field
function sampleCell() {
  const scenario = scenarioA as unknown as Scenario;
  const cell = scenario.frames.find((frame) => frame.t === 0)?.cells.find((candidate) => candidate.id === "C-A07");
  if (!cell) throw new Error("Scenario A requires C-A07 at t=0");
  return cell;
}

describe("buildVolume", () => {
  it("creates the documented compact float grid deterministically", () => {
    const cell = sampleCell();
    const first = buildVolume(cell);
    const second = buildVolume(cell);

    expect(first).toBeInstanceOf(Float32Array);
    expect(first).toHaveLength(24 * 24 * 16);
    expect(first).toEqual(second);
  });

  it("places its strongest reflectivity near the derived updraft core", () => {
    const cell = sampleCell();
    const volume = buildVolume(cell);
    const peakIndex = volume.reduce((peak, value, index) => value > volume[peak]! ? index : peak, 0);
    const peakX = peakIndex % VOLUME_WIDTH;
    const peakY = Math.floor(peakIndex / VOLUME_WIDTH) % VOLUME_DEPTH;
    const core = volumeCoreFor(cell);

    expect(Math.abs(peakX - core.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(peakY - core.y)).toBeLessThanOrEqual(2);
  });
});
