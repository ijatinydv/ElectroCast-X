import type { SyntheticAssets } from "@/types/assets";
import type { Cell } from "@/types/scenario";
import type { Corridor, Polygon } from "./corridor";

// describes synthetic assets exposed by one corridor and their earliest arrival
export type Exposure = { villages: number; schools: number; hospitals: number; transmission: number; arrivalMin: number };

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
  };
}
