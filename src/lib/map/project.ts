import { geoMercator } from "d3-geo";
import type { Scenario } from "@/types/scenario";
type Projection = ReturnType<typeof geoMercator>;
export class MapProjection {
  private current: Projection; private previous: Projection | null = null; private start = 0;
  constructor(scenario: Scenario, private width: number, private height: number) { this.current = this.fit(scenario); }
  private fit(scenario: Scenario) { const [w, s, e, n] = scenario.region.bbox; return geoMercator().fitExtent([[28, 28], [this.width - 28, this.height - 28]], { type: "Polygon", coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] }); }
  refit(scenario: Scenario, now: number) { this.previous = this.current; this.current = this.fit(scenario); this.start = now; }
  project(point: [number, number], now: number): [number, number] { const to = this.current(point) as [number, number]; if (!this.previous) return to; const p = Math.min(1, (now - this.start) / 400); if (p >= 1) { this.previous = null; return to; } const from = this.previous(point) as [number, number]; const eased = p * p * (3 - 2 * p); return [from[0] + (to[0] - from[0]) * eased, from[1] + (to[1] - from[1]) * eased]; }
  invert(point: [number, number]) { const invert = this.current.invert; if (!invert) return point; return invert(point)! as [number, number]; }
  get tweening() { return this.previous !== null; }
}
