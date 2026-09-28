import { describe, expect, it } from "vitest";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import { corridorFor } from "@/lib/derive";
import { getSyntheticAssets } from "@/lib/geo/load";
import { pointInPolygon, segmentIsInsideCorridor } from "@/lib/map/layers/assets";
import type { Scenario } from "@/types/scenario";

// loads the severe-storm fixture that has prepared selected-corridor exposure records
const scenario = scenarioB as unknown as Scenario;

// selects the t-zero storm cell shared by the corridor and asset assertions
const cell = scenario.frames.find((frame) => frame.t === 0)?.cells[0];

// proves selected 30-minute exposure highlighting uses the same prepared outer corridor geometry as map corridors
describe("map exposure assets", () => {
  // verifies the selected outer polygon includes both a point glyph and a line segment
  it("identifies point glyphs and transmission segments inside the selected outer corridor", () => {
    expect(cell).toBeDefined();
    if (!cell) return;
    const outer = corridorFor(cell, 30, 1).outer;
    const assets = getSyntheticAssets();

    expect(assets.points.some((asset) => asset.type !== "village" && pointInPolygon(asset.lonLat, outer))).toBe(true);
    expect(assets.polylines.some((line) => line.path.slice(1).some((end, index) => {
      const start = line.path[index];
      return start ? segmentIsInsideCorridor(start, end, outer) : false;
    }))).toBe(true);
  });
});
