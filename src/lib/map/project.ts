import { geoMercator, type GeoProjection } from "d3-geo";
import type { Cell, Scenario } from "@/types/scenario";

// names geographic and canvas coordinate pairs shared by map calculations
export type ScreenPoint = readonly [number, number];

// represents a stable immutable snapshot of d3 projection parameters for canvas drawing
export interface MapProjection {
  project: (lonLat: ScreenPoint) => ScreenPoint;
  scale: number;
  translate: ScreenPoint;
}

// retains the endpoints and timing required to animate a scenario projection refit
export interface ProjectionTween {
  from: MapProjection;
  to: MapProjection;
  startedAt: number;
  duration: number;
}

// converts a scenario bounding box into geometry d3 can fit to the map viewport
function regionGeometry(region: Scenario["region"]): GeoJSON.Polygon {
  const [west, south, east, north] = region.bbox;
  return {
    type: "Polygon",
    coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
  };
}

// captures d3's mutable projection values in a stable canvas-friendly representation
function toMapProjection(projection: GeoProjection): MapProjection {
  const scale = projection.scale();
  const translate = projection.translate() as ScreenPoint;

  return {
    scale,
    translate,
    project: (lonLat) => {
      const point = projection([lonLat[0], lonLat[1]]);
      return point ? [point[0], point[1]] : [0, 0];
    },
  };
}

// fits the active scenario region within the available centre panel with a restrained map margin
export function fitProjection(region: Scenario["region"], width: number, height: number): MapProjection {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const inset = Math.min(32, safeWidth * 0.08, safeHeight * 0.08);
  const projection = geoMercator().fitExtent(
    [[inset, inset], [safeWidth - inset, safeHeight - inset]],
    regionGeometry(region),
  );

  return toMapProjection(projection);
}

// preserves the requested 400ms data-change motion while avoiding a second render system
export function startProjectionTween(from: MapProjection, to: MapProjection, startedAt: number, duration = 400): ProjectionTween {
  return { from, to, startedAt, duration };
}

// interpolates a projection using the map's shared instrument easing curve
export function projectTweenAt(tween: ProjectionTween, now: number): { projection: MapProjection; complete: boolean } {
  const rawProgress = Math.min(1, Math.max(0, (now - tween.startedAt) / tween.duration));
  const progress = 1 - (1 - rawProgress) ** 3;
  const scale = tween.from.scale + (tween.to.scale - tween.from.scale) * progress;
  const translate: ScreenPoint = [
    tween.from.translate[0] + (tween.to.translate[0] - tween.from.translate[0]) * progress,
    tween.from.translate[1] + (tween.to.translate[1] - tween.from.translate[1]) * progress,
  ];
  const ratio = scale / tween.to.scale;

  return {
    projection: {
      scale,
      translate,
      project: (lonLat) => {
        const target = tween.to.project(lonLat);
        return [translate[0] + (target[0] - tween.to.translate[0]) * ratio, translate[1] + (target[1] - tween.to.translate[1]) * ratio];
      },
    },
    complete: rawProgress === 1,
  };
}

// selects the temporally nearest prepared frame without introducing component-owned map data
export function frameCellsAt(scenario: Scenario, timeMin: number): readonly Cell[] {
  return scenario.frames.reduce((closest, frame) => (
    Math.abs(frame.t - timeMin) < Math.abs(closest.t - timeMin) ? frame : closest
  )).cells;
}

// estimates a cell's projected radius from its geographic radius for screen-space pointer selection
export function cellRadiusPx(cell: Cell, projection: MapProjection): number {
  const latitudeRadians = cell.centroid[1] * Math.PI / 180;
  const longitudeOffset = cell.radiusKm / (111.32 * Math.max(Math.cos(latitudeRadians), 0.01));
  const center = projection.project(cell.centroid);
  const edge = projection.project([cell.centroid[0] + longitudeOffset, cell.centroid[1]]);
  return Math.hypot(edge[0] - center[0], edge[1] - center[1]);
}

// returns the nearest selectable cell when the pointer is inside its radius plus the touch allowance
export function hitTestCells(cells: readonly Cell[], projection: MapProjection, point: ScreenPoint, allowance = 8): string | null {
  let nearest: { id: string; distance: number; limit: number } | null = null;

  for (const cell of cells) {
    const center = projection.project(cell.centroid);
    const distance = Math.hypot(point[0] - center[0], point[1] - center[1]);
    const limit = cellRadiusPx(cell, projection) + allowance;

    if (distance <= limit && (!nearest || distance < nearest.distance)) {
      nearest = { id: cell.id, distance, limit };
    }
  }

  return nearest?.id ?? null;
}
