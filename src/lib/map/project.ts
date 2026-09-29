import { geoMercator, type GeoProjection } from "d3-geo";
import { STATION_GLYPH_SELECTION_RADIUS_PX } from "./stationGlyph";
import type { Cell, Scenario } from "@/types/scenario";

// names geographic and canvas coordinate pairs shared by map calculations
export type ScreenPoint = readonly [number, number];

// represents a stable immutable snapshot of d3 projection parameters for canvas drawing
export interface MapProjection {
  project: (lonLat: ScreenPoint) => ScreenPoint;
  unproject: (point: ScreenPoint) => ScreenPoint | null;
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
    unproject: (point) => {
      const invert = projection.invert;
      if (!invert) return null;
      const coordinate = invert([point[0], point[1]]);
      return coordinate ? [coordinate[0], coordinate[1]] : null;
    },
  };
}

// fits the active scenario region within the available centre panel with a restrained map margin
export function fitProjection(region: Scenario["region"], width: number, height: number): MapProjection {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const inset = Math.min(32, safeWidth * 0.08, safeHeight * 0.08);
  const [west, south, east, north] = region.bbox;
  const reference = geoMercator().scale(1).translate([0, 0]);
  const northWest = reference([west, north]) ?? [0, 0];
  const southEast = reference([east, south]) ?? [1, 1];
  const scale = Math.min(
    (safeWidth - inset * 2) / Math.abs(southEast[0] - northWest[0]),
    (safeHeight - inset * 2) / Math.abs(southEast[1] - northWest[1]),
  );
  const centreX = (northWest[0] + southEast[0]) / 2;
  const centreY = (northWest[1] + southEast[1]) / 2;
  const projection = geoMercator().scale(scale).translate([safeWidth / 2 - centreX * scale, safeHeight / 2 - centreY * scale]);

  return toMapProjection(projection);
}

// recentres an existing projection on an operator-selected map asset without changing its zoom
export function panProjection(projection: MapProjection, lonLat: ScreenPoint, width: number, height: number): MapProjection {
  const focus = projection.project(lonLat);
  const offset: ScreenPoint = [width / 2 - focus[0], height / 2 - focus[1]];
  return {
    scale: projection.scale,
    translate: [projection.translate[0] + offset[0], projection.translate[1] + offset[1]],
    project: (point) => {
      const projected = projection.project(point);
      return [projected[0] + offset[0], projected[1] + offset[1]];
    },
    unproject: (point) => projection.unproject([point[0] - offset[0], point[1] - offset[1]]),
  };
}

// zooms an existing projection around a focal screen point while capping extreme scales
export function zoomProjection(projection: MapProjection, factor: number, center: ScreenPoint): MapProjection {
  const nextScale = Math.max(100, Math.min(250000, projection.scale * factor));
  const ratio = nextScale / projection.scale;
  const nextTranslate: ScreenPoint = [
    center[0] - (center[0] - projection.translate[0]) * ratio,
    center[1] - (center[1] - projection.translate[1]) * ratio,
  ];

  return {
    scale: nextScale,
    translate: nextTranslate,
    project: (lonLat) => {
      const point = projection.project(lonLat);
      return [
        center[0] + (point[0] - center[0]) * ratio,
        center[1] + (point[1] - center[1]) * ratio,
      ];
    },
    unproject: (point) => {
      const unscaledPoint: ScreenPoint = [
        center[0] + (point[0] - center[0]) / ratio,
        center[1] + (point[1] - center[1]) / ratio,
      ];
      return projection.unproject(unscaledPoint);
    },
  };
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
      unproject: (point) => tween.to.unproject([
        tween.to.translate[0] + (point[0] - translate[0]) / ratio,
        tween.to.translate[1] + (point[1] - translate[1]) / ratio,
      ]),
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

// estimates a cell's projected radius for geographic layers that scale with storm extent
export function cellRadiusPx(cell: Cell, projection: MapProjection): number {
  const latitudeRadians = cell.centroid[1] * Math.PI / 180;
  const longitudeOffset = cell.radiusKm / (111.32 * Math.max(Math.cos(latitudeRadians), 0.01));
  const center = projection.project(cell.centroid);
  const edge = projection.project([cell.centroid[0] + longitudeOffset, cell.centroid[1]]);
  return Math.hypot(edge[0] - center[0], edge[1] - center[1]);
}

// returns the nearest cell inside the station glyph's fixed outer-ring pointer target
export function hitTestCells(cells: readonly Cell[], projection: MapProjection, point: ScreenPoint): string | null {
  let nearest: { id: string; distance: number } | null = null;

  for (const cell of cells) {
    const center = projection.project(cell.centroid);
    const distance = Math.hypot(point[0] - center[0], point[1] - center[1]);

    if (distance <= STATION_GLYPH_SELECTION_RADIUS_PX && (!nearest || distance < nearest.distance)) {
      nearest = { id: cell.id, distance };
    }
  }

  return nearest?.id ?? null;
}
