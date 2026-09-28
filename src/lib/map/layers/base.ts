import districtsData from "@/data/geo/odisha-districts.json";
import stateData from "@/data/geo/odisha-state.json";
import type { GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonGeometry, GeoJsonPosition, OdishaDistrictProperties, OdishaStateProperties } from "@/types/geo";
import type { Layer, MapFrameState } from "../engine";
import type { ScreenPoint } from "../project";

// provides the typed district boundaries bundled for offline rendering
const districts = districtsData as unknown as GeoJsonFeatureCollection<OdishaDistrictProperties>;

// provides the typed dissolved Odisha outline bundled for offline rendering
const stateBoundary = stateData as unknown as GeoJsonFeatureCollection<OdishaStateProperties>;

// records a measured label box for collision-free district names
interface LabelBox { x: number; y: number; width: number; height: number; }

// draws the required outline, district borders, and readable district labels into the static canvas
export const baseLayer: Layer = {
  id: "base",
  draw: (ctx, state) => {
    ctx.fillStyle = state.theme.background;
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.beginPath();
    ctx.strokeStyle = state.theme.foregroundTertiary;
    ctx.lineWidth = 1;
    stateBoundary.features.forEach((feature) => drawGeometry(ctx, feature.geometry, state));
    ctx.stroke();
    if (!state.layers.districts) return;
    ctx.beginPath();
    ctx.strokeStyle = state.theme.lineStrong;
    districts.features.forEach((feature) => drawGeometry(ctx, feature.geometry, state));
    ctx.stroke();
    drawLabels(ctx, state);
  },
};

// traces a geojson polygon or multipolygon through the active map projection
function drawGeometry(ctx: CanvasRenderingContext2D, geometry: GeoJsonGeometry, state: MapFrameState): void {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  polygons.forEach((polygon) => polygon.forEach((ring) => {
    const first = ring[0];
    if (!first) return;
    const [startX, startY] = state.projection.project(first);
    ctx.moveTo(startX, startY);
    ring.slice(1).forEach((position) => {
      const [x, y] = state.projection.project(position);
      ctx.lineTo(x, y);
    });
    ctx.closePath();
  }));
}

// places larger districts first and skips any name whose bounding box would collide
function drawLabels(ctx: CanvasRenderingContext2D, state: MapFrameState): void {
  const occupied: LabelBox[] = [];
  const candidates = districts.features
    .map((feature) => ({ feature, centroid: featureCentroid(feature), area: geometryArea(feature.geometry) }))
    .sort((left, right) => right.area - left.area);
  ctx.fillStyle = state.theme.foregroundTertiary;
  ctx.font = `11px ${state.theme.fontSans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  candidates.forEach(({ feature, centroid }) => {
    const [x, y] = state.projection.project(centroid);
    const width = ctx.measureText(feature.properties.district).width;
    const label = { x: x - width / 2, y: y - 6, width, height: 12 };
    if (occupied.some((existing) => overlaps(existing, label))) return;
    ctx.fillText(feature.properties.district, x, y);
    occupied.push(label);
  });
}

// derives a district centre from its largest exterior polygon ring
function featureCentroid(feature: GeoJsonFeature<OdishaDistrictProperties>): GeoJsonPosition {
  const rings = feature.geometry.type === "Polygon" ? feature.geometry.coordinates : feature.geometry.coordinates.flat();
  const largest = rings.reduce((current, ring) => ringArea(ring) > ringArea(current) ? ring : current);
  return ringCentroid(largest);
}

// calculates a total geographic footprint to prioritise larger district labels
function geometryArea(geometry: GeoJsonGeometry): number {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flat().reduce((area, ring) => area + ringArea(ring), 0);
}

// calculates the absolute shoelace area for one geographic ring
function ringArea(ring: readonly GeoJsonPosition[]): number {
  return Math.abs(ring.reduce((total, point, index) => {
    const next = ring[(index + 1) % ring.length] ?? point;
    return total + point[0] * next[1] - next[0] * point[1];
  }, 0) / 2);
}

// calculates a polygon centre without introducing another geometry dependency
function ringCentroid(ring: readonly GeoJsonPosition[]): GeoJsonPosition {
  const result = ring.reduce((total, point, index) => {
    const next = ring[(index + 1) % ring.length] ?? point;
    const cross = point[0] * next[1] - next[0] * point[1];
    return { area: total.area + cross, x: total.x + (point[0] + next[0]) * cross, y: total.y + (point[1] + next[1]) * cross };
  }, { area: 0, x: 0, y: 0 });
  if (Math.abs(result.area) < Number.EPSILON) return ring[0] ?? [0, 0];
  return [result.x / (result.area * 3), result.y / (result.area * 3)];
}

// detects an axis-aligned collision between two potential district labels
function overlaps(left: LabelBox, right: LabelBox): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
}
