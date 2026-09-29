import type { Cell } from "@/types/scenario";
import { geoDistance } from "d3-geo";

// constrains corridor lookups to the forecast horizons generated in scenario data
export type CorridorHorizon = "15" | "30" | "60";

// represents a closed longitude-latitude boundary used by map and exposure logic
export type Polygon = [number, number][];

// preserves the nested uncertainty boundaries returned for one forecast horizon
export type Corridor = { center: Polygon; inner: Polygon; outer: Polygon };

// scales one polygon about the storm centroid without changing its vertex ordering
function scalePolygon(polygon: Polygon, origin: [number, number], scale: number): Polygon {
  return polygon.map(([lon, lat]) => [origin[0] + (lon - origin[0]) * scale, origin[1] + (lat - origin[1]) * scale]);
}

// applies sensor uncertainty to the nested corridor boundaries for a forecast horizon
export function corridorFor(cell: Cell, horizon: CorridorHorizon | 15 | 30 | 60, scale: number): Corridor {
  const base = cell.corridors[String(horizon) as CorridorHorizon];
  if (!base) throw new Error(`Missing ${horizon}-minute corridor for cell ${cell.id}`);
  const innerScale = 1 + (scale - 1) * 0.5;
  return {
    center: scalePolygon(base.center, cell.centroid, 1),
    inner: scalePolygon(base.inner, cell.centroid, innerScale),
    outer: scalePolygon(base.outer, cell.centroid, scale),
  };
}

// measures the narrow cross-corridor edge after sensor uncertainty has been applied
export function corridorWidthKm(cell: Cell, scale: number): number {
  const boundary = corridorFor(cell, 30, scale).outer;
  if (boundary.length < 2) return 0;
  const edgeLengths = boundary.map((point, index) => geoDistance(point, boundary[(index + 1) % boundary.length]!) * 6371);
  return Math.min(...edgeLengths);
}
