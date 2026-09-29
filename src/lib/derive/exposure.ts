import type { SyntheticAssets } from "@/types/assets";
import type { Cell, Frame } from "@/types/scenario";
import { corridorFor, type Corridor, type CorridorHorizon, type Polygon } from "./corridor";
import { type SensorMask, widthScale } from "./mask";

// identifies a prepared asset listed in the exposure panel
export type ExposureAsset = { id: string; name: string; type: "village" | "school" | "hospital" | "transmission" };

// groups corridor counts with the named assets available for map focus
export type Exposure = { villages: number; schools: number; hospitals: number; transmission: number; arrivalMin: number; assets: ExposureAsset[] };

// narrows prepared points to the asset types represented in the exposure summary
function isExposurePoint(asset: SyntheticAssets["points"][number]): asset is SyntheticAssets["points"][number] & { type: "village" | "school" | "hospital" } {
  return asset.type === "village" || asset.type === "school" || asset.type === "hospital";
}

// detects whether a point belongs to a corridor polygon including its outer boundary
function pointInPolygon([x, y]: [number, number], polygon: Polygon): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index]!;
    const [xj, yj] = polygon[previous]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// estimates along-track distance in kilometres for the arrival calculation
function distanceKm(from: [number, number], to: [number, number]): number {
  const latitudeRadians = ((from[1] + to[1]) / 2) * Math.PI / 180;
  const lonKm = (to[0] - from[0]) * 111.32 * Math.cos(latitudeRadians);
  const latKm = (to[1] - from[1]) * 110.57;
  return Math.hypot(lonKm, latKm);
}

// counts synthetic assets in the 30-minute inner corridor and estimates first arrival
export function exposureFor(corridor: Corridor, assets: SyntheticAssets, cell: Pick<Cell, "centroid" | "motion">): Exposure {
  const inside = (point: [number, number]) => pointInPolygon(point, corridor.inner);
  const points = assets.points.filter((asset) => inside(asset.lonLat));
  const transmission = assets.polylines.filter((line) => line.path.some(inside)).length;
  const distances = points.map((asset) => distanceKm(cell.centroid, asset.lonLat));
  const arrivalMin = distances.length === 0 ? 0 : Math.round(Math.min(...distances) / cell.motion.speedKmh * 60);
  return {
    villages: points.filter((asset) => asset.type === "village").length,
    schools: points.filter((asset) => asset.type === "school").length,
    hospitals: points.filter((asset) => asset.type === "hospital").length,
    transmission,
    arrivalMin,
    assets: [
      ...points.filter(isExposurePoint).map((asset) => ({ id: asset.id, name: asset.name, type: asset.type })),
      ...assets.polylines.filter((line) => line.path.some(inside)).map((line) => ({ id: line.id, name: line.name, type: line.type })),
    ],
  };
}

// derives exposure from the same sensor-aware uncertainty corridor rendered on the map
export function exposureForCell(cell: Cell, horizon: CorridorHorizon | 15 | 30 | 60, sensorMask: SensorMask, sensorHealth: Frame["sensorHealth"], assets: SyntheticAssets): Exposure {
  return exposureFor(corridorFor(cell, horizon, widthScale(sensorMask, sensorHealth)), assets, cell);
}
