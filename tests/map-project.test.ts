import { describe, expect, it } from "vitest";
import { cellRadiusPx, fitProjection, hitTestCells, projectTweenAt, startProjectionTween } from "@/lib/map/project";
import type { Cell, Scenario } from "@/types/scenario";

const region: Scenario["region"] = { bbox: [84, 19, 88, 23], center: [86, 21], zoom: 7 };

// supplies the smallest complete cell required to verify screen-space selection behavior
const cell: Cell = {
  id: "test-cell",
  centroid: [86, 21],
  radiusKm: 10,
  reflectivityDbz: 30,
  stage: "developing",
  mode: "first-flash",
  cloudTopCoolingKmin: 0,
  echoTopKm: 8,
  zdrColumnLevel: "none",
  kdpCore: 0,
  updraftMs: 0,
  cape: 0,
  freezingLevelKm: 4,
  flashRate: 0,
  motion: { dirDeg: 0, speedKmh: 0 },
  corridors: { "15": { center: [], inner: [], outer: [] }, "30": { center: [], inner: [], outer: [] }, "60": { center: [], inner: [], outer: [] } },
  decomposition: { motion: 0, growth: 0, initiation: 0, initiationSites: [] },
  headlineRisk: 0,
  evidence: [],
};

describe("map projection", () => {
  // proves the fitted projection keeps the active scenario region inside the map viewport
  it("fits the scenario bounding box inside the viewport", () => {
    const projection = fitProjection(region, 800, 500);
    const northWest = projection.project([84, 23]);
    const southEast = projection.project([88, 19]);

    expect(northWest[0]).toBeGreaterThanOrEqual(0);
    expect(southEast[0]).toBeLessThanOrEqual(800);
    expect(northWest[1]).toBeGreaterThanOrEqual(0);
    expect(southEast[1]).toBeLessThanOrEqual(500);
  });

  // verifies the 400ms transition resolves at the target projection rather than snapping early
  it("completes a projection refit at 400ms", () => {
    const from = fitProjection(region, 800, 500);
    const to = fitProjection({ ...region, bbox: [85, 20, 87, 22] }, 800, 500);
    const tween = startProjectionTween(from, to, 100, 400);

    expect(projectTweenAt(tween, 500).complete).toBe(true);
    expect(projectTweenAt(tween, 500).projection.translate).toEqual(to.translate);
  });

  // accepts an eight-pixel extension beyond the projected cell radius and rejects farther clicks
  it("hit-tests the nearest cell using the documented touch allowance", () => {
    const projection = fitProjection(region, 800, 500);
    const center = projection.project(cell.centroid);
    const radius = cellRadiusPx(cell, projection);

    expect(hitTestCells([cell], projection, [center[0] + radius + 8, center[1]])).toBe(cell.id);
    expect(hitTestCells([cell], projection, [center[0] + radius + 9, center[1]])).toBeNull();
  });
});
