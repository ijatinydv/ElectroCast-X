import { describe, expect, it } from "vitest";
import { frameAt } from "@/lib/map/interpolate";
import scenario from "@/data/scenarios/a-first-flash.json";
import type { Scenario } from "@/types/scenario";

// treats the generated JSON fixture as the validated runtime scenario contract
const preparedScenario = scenario as unknown as Scenario;

describe("frameAt", () => {
  it("interpolates scalar fields and centroids between adjacent keyframes", () => {
    const start = preparedScenario.frames[2]!;
    const end = preparedScenario.frames[3]!;
    const time = (start.t + end.t) / 2;
    const startCell = start.cells[0]!;
    const endCell = end.cells[0]!;

    const frame = frameAt(preparedScenario, time);
    const cell = frame.cells[0]!;

    expect(cell.centroid[0]).toBeCloseTo((startCell.centroid[0] + endCell.centroid[0]) / 2);
    expect(cell.radiusKm).toBeCloseTo((startCell.radiusKm + endCell.radiusKm) / 2);
    expect(cell.reflectivityDbz).toBeCloseTo((startCell.reflectivityDbz + endCell.reflectivityDbz) / 2);
    expect(cell.corridors["30"].outer[0]![0]).toBeCloseTo((startCell.corridors["30"].outer[0]![0] + endCell.corridors["30"].outer[0]![0]) / 2);
  });

  it("returns exact prepared cells at keyframes and discrete fields from the nearer keyframe", () => {
    const keyframe = preparedScenario.frames[3]!;
    const frame = frameAt(preparedScenario, keyframe.t);
    const midpoint = frameAt(preparedScenario, (preparedScenario.frames[2]!.t + keyframe.t) / 2 + 0.1);

    expect(frame.cells).toEqual(keyframe.cells);
    expect(frame.lightning).toEqual(keyframe.lightning);
    expect(midpoint.cells[0]!.stage).toBe(keyframe.cells[0]!.stage);
  });

  it("clamps requests beyond the supported scenario range", () => {
    const belowRange = frameAt(preparedScenario, -90);
    const aboveRange = frameAt(preparedScenario, 90);

    expect(belowRange.t).toBe(-60);
    expect(aboveRange.t).toBe(60);
    expect(belowRange.cells).toEqual(preparedScenario.frames[0]!.cells);
    expect(aboveRange.cells).toEqual(preparedScenario.frames.at(-1)!.cells);
  });
});
