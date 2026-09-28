import { geoMercator } from "d3-geo";
import type { Scenario } from "@/types/scenario";

type Point = [number, number];

export type ScenarioRegion = Scenario["region"];

interface ProjectionValues {
  scale: number;
  translate: Point;
}

function regionPolygon(region: ScenarioRegion): GeoJSON.Polygon {
  const [west, south, east, north] = region.bbox;
  return { type: "Polygon", coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] };
}

function easeInstrument(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function fittedValues(region: ScenarioRegion, width: number, height: number): ProjectionValues {
  const padding = Math.min(48, Math.max(16, Math.min(width, height) * 0.08));
  const projection = geoMercator().fitExtent(
    [[padding, padding], [Math.max(padding + 1, width - padding), Math.max(padding + 1, height - padding)]],
    regionPolygon(region),
  );
  return { scale: projection.scale(), translate: projection.translate() as Point };
}

// Projects prepared scenario coordinates and interpolates between fitted regions without React state.
export class MapProjection {
  private values: ProjectionValues = { scale: 1, translate: [0, 0] };
  private start: ProjectionValues = this.values;
  private target: ProjectionValues = this.values;
  private startedAt = 0;
  private durationMs = 0;

  constructor(region: ScenarioRegion, width: number, height: number) {
    this.values = fittedValues(region, width, height);
    this.start = this.values;
    this.target = this.values;
  }

  refit(region: ScenarioRegion, width: number, height: number, now: number, durationMs = 400): void {
    this.update(now);
    this.start = { scale: this.values.scale, translate: [...this.values.translate] as Point };
    this.target = fittedValues(region, width, height);
    this.startedAt = now;
    this.durationMs = durationMs;
    if (durationMs === 0) this.values = this.target;
  }

  // Returns true while a refit needs the engine to schedule another paint.
  update(now: number): boolean {
    if (this.durationMs === 0) return false;
    const progress = Math.min(1, Math.max(0, (now - this.startedAt) / this.durationMs));
    const eased = easeInstrument(progress);
    this.values = {
      scale: this.start.scale + (this.target.scale - this.start.scale) * eased,
      translate: [
        this.start.translate[0] + (this.target.translate[0] - this.start.translate[0]) * eased,
        this.start.translate[1] + (this.target.translate[1] - this.start.translate[1]) * eased,
      ],
    };
    if (progress === 1) this.durationMs = 0;
    return this.durationMs > 0;
  }

  project([longitude, latitude]: Point): Point {
    const radians = Math.PI / 180;
    return [
      this.values.translate[0] + this.values.scale * longitude * radians,
      this.values.translate[1] - this.values.scale * Math.log(Math.tan(Math.PI / 4 + (latitude * radians) / 2)),
    ];
  }
}
