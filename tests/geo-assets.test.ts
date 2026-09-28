import { describe, expect, it } from "vitest";
import { buildAssets } from "../scripts/build-assets";
import { getOdishaDistricts, getOdishaState, getSyntheticAssets } from "../src/lib/geo/load";
import type { GeoJsonGeometry, GeoJsonPosition } from "../src/types/geo";

// extracts coordinate pairs from nested GeoJSON arrays for bbox assertions
function collectPositions(value: unknown): GeoJsonPosition[] {
  if (!Array.isArray(value)) return [];
  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    return [[value[0], value[1]]];
  }
  return value.flatMap((child: unknown) => collectPositions(child));
}

// extracts polygon rings so tests can verify their GeoJSON closure rules
function collectRings(geometry: GeoJsonGeometry): GeoJsonPosition[][] {
  return geometry.type === "Polygon"
    ? geometry.coordinates
    : geometry.coordinates.flatMap((polygon) => polygon);
}

describe("Odisha geo and synthetic assets", () => {
  it("loads thirty valid district features within the Odisha bbox", () => {
    const districts = getOdishaDistricts();
    const districtNames = districts.features.map((feature) => feature.properties.district);
    const positions = districts.features.flatMap((feature) => collectPositions(feature.geometry.coordinates));
    const bounds = positions.reduce<[number, number, number, number]>(
      (current, [longitude, latitude]) => [
        Math.min(current[0], longitude),
        Math.min(current[1], latitude),
        Math.max(current[2], longitude),
        Math.max(current[3], latitude),
      ],
      [Infinity, Infinity, -Infinity, -Infinity],
    );

    expect(districts.type).toBe("FeatureCollection");
    expect(districts.features).toHaveLength(30);
    expect(new Set(districtNames).size).toBe(30);
    expect(districts.features.every((feature) =>
      collectRings(feature.geometry).every((ring) =>
        ring.length >= 4 && ring[0]?.[0] === ring.at(-1)?.[0] && ring[0]?.[1] === ring.at(-1)?.[1],
      ),
    )).toBe(true);
    expect(districtNames).toContain("Mayurbhanj");
    expect(districtNames).toContain("Kendujhar");
    expect(bounds[0]).toBeGreaterThanOrEqual(81.3);
    expect(bounds[1]).toBeGreaterThanOrEqual(17.7);
    expect(bounds[2]).toBeLessThanOrEqual(87.5);
    expect(bounds[3]).toBeLessThanOrEqual(22.6);
  });

  it("loads a single state outline within the same Odisha bbox", () => {
    const state = getOdishaState();
    const positions = state.features.flatMap((feature) => collectPositions(feature.geometry.coordinates));
    expect(state.type).toBe("FeatureCollection");
    expect(state.features).toHaveLength(1);
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every(([longitude, latitude]) => longitude >= 81.3 && longitude <= 87.5 && latitude >= 17.7 && latitude <= 22.6)).toBe(true);
  });

  it("loads the required synthetic asset counts around all three scenario regions", () => {
    const assets = getSyntheticAssets();
    const count = (type: string) => assets.points.filter((asset) => asset.type === type).length;
    const scenarioRegions = [
      { west: 85.72, south: 21.2, east: 86.48, north: 22.25 },
      { west: 86.2, south: 20.9, east: 87.3, north: 21.82 },
      { west: 85.22, south: 19.88, east: 86.35, north: 20.7 },
    ];
    const villagesPerRegion = [
      assets.points.filter((asset) => asset.type === "village" && asset.lonLat[0] >= 85.72 && asset.lonLat[0] <= 86.48 && asset.lonLat[1] >= 21.2 && asset.lonLat[1] <= 22.25).length,
      assets.points.filter((asset) => asset.type === "village" && asset.lonLat[0] >= 86.2 && asset.lonLat[0] <= 87.3 && asset.lonLat[1] >= 20.9 && asset.lonLat[1] <= 21.82).length,
      assets.points.filter((asset) => asset.type === "village" && asset.lonLat[0] >= 85.22 && asset.lonLat[0] <= 86.35 && asset.lonLat[1] >= 19.88 && asset.lonLat[1] <= 20.7).length,
    ];
    const regionalExposure = scenarioRegions.map((region) => {
      const inside = ([longitude, latitude]: [number, number]) =>
        longitude >= region.west && longitude <= region.east && latitude >= region.south && latitude <= region.north;
      return {
        schools: assets.points.filter((asset) => asset.type === "school" && inside(asset.lonLat)).length,
        hospitals: assets.points.filter((asset) => asset.type === "hospital" && inside(asset.lonLat)).length,
        events: assets.points.filter((asset) => asset.type === "event" && inside(asset.lonLat)).length,
        transmission: assets.polylines.filter((line) => line.path.some(inside)).length,
      };
    });

    expect(count("village")).toBe(60);
    expect(count("school")).toBe(25);
    expect(count("hospital")).toBe(12);
    expect(count("airport")).toBe(2);
    expect(count("mine")).toBe(6);
    expect(count("event")).toBe(8);
    expect(assets.polylines).toHaveLength(4);
    expect(assets.points.every((asset) => asset.synthetic === true)).toBe(true);
    expect(assets.polylines.every((asset) => asset.synthetic === true)).toBe(true);
    expect(assets.points.every((asset) => asset.lonLat[0] >= 81.3 && asset.lonLat[0] <= 87.5 && asset.lonLat[1] >= 17.7 && asset.lonLat[1] <= 22.6)).toBe(true);
    expect(assets.polylines.every((line) => line.path.every((position) => position[0] >= 81.3 && position[0] <= 87.5 && position[1] >= 17.7 && position[1] <= 22.6))).toBe(true);
    expect(villagesPerRegion.every((count) => count >= 20)).toBe(true);
    expect(regionalExposure.every((region) => region.schools > 0 && region.hospitals > 0 && region.events > 0 && region.transmission > 0)).toBe(true);
    expect(buildAssets()).toEqual(assets);
  });
});
