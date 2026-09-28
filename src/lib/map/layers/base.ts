import { getOdishaDistricts, getOdishaState } from "@/lib/geo/load";
import type { GeoJsonFeature, GeoJsonGeometry, GeoJsonPosition, OdishaDistrictProperties } from "@/types/geo";
import type { Layer, MapFrameState } from "../engine";

interface LabelCandidate {
  name: string;
  center: GeoJsonPosition;
  area: number;
}

interface LabelBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const districts = getOdishaDistricts();
const state = getOdishaState();

// draws a GeoJSON polygon without relying on a mutable d3 projection instance
function traceGeometry(ctx: CanvasRenderingContext2D, geometry: GeoJsonGeometry, project: MapFrameState["projection"]["project"]): void {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      const first = ring[0];
      if (!first) continue;
      const [startX, startY] = project(first);
      ctx.moveTo(startX, startY);
      for (const point of ring.slice(1)) {
        const [x, y] = project(point);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
  }
}

// uses the average polygon vertices as a deterministic label anchor within each supplied boundary
function geometryCenter(geometry: GeoJsonGeometry): GeoJsonPosition {
  const rings = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  const points = rings.flat();
  const total = points.reduce<[number, number]>((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  return [total[0] / points.length, total[1] / points.length];
}

// estimates polygon area in degree space solely to prioritize larger labels before collision filtering
function geometryArea(geometry: GeoJsonGeometry): number {
  const rings = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  return rings.reduce((total, ring) => total + Math.abs(ring.reduce((sum, point, index) => {
    const next = ring[(index + 1) % ring.length] ?? point;
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0)) / 2, 0);
}

// determines whether two axis-aligned canvas label boxes overlap
export function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

// retains only non-overlapping labels, preferring larger districts as specified for the default view
export function placeDistrictLabels(
  candidates: readonly LabelCandidate[],
  project: MapFrameState["projection"]["project"],
  measure: (text: string) => number,
): Array<LabelCandidate & { x: number; y: number }> {
  const occupied: LabelBox[] = [];
  const labels: Array<LabelCandidate & { x: number; y: number }> = [];
  for (const candidate of [...candidates].sort((a, b) => b.area - a.area)) {
    const [x, y] = project(candidate.center);
    const width = measure(candidate.name);
    const box = { left: x - width / 2 - 3, right: x + width / 2 + 3, top: y - 8, bottom: y + 8 };
    if (occupied.some((other) => boxesOverlap(box, other))) continue;
    occupied.push(box);
    labels.push({ ...candidate, x, y });
  }
  return labels;
}

const labelCandidates: readonly LabelCandidate[] = districts.features.map((feature: GeoJsonFeature<OdishaDistrictProperties>) => ({
  name: feature.properties.district,
  center: geometryCenter(feature.geometry),
  area: geometryArea(feature.geometry),
}));

// renders the state boundary, district seams, and collision-free place labels into the static cache
export const baseLayer: Layer = {
  id: "base",
  draw: (ctx, state) => {
    if (!state.layers.districts) return;
    ctx.save();
    ctx.beginPath();
    state.features.forEach((feature) => traceGeometry(ctx, feature.geometry, state.projection.project));
    ctx.strokeStyle = state.theme.lineStrong;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    state.outline.forEach((feature) => traceGeometry(ctx, feature.geometry, state.projection.project));
    ctx.strokeStyle = state.theme.fg3;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = state.theme.fg3;
    ctx.font = "11px var(--font-sans)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    placeDistrictLabels(labelCandidates, state.projection.project, (text) => ctx.measureText(text).width)
      .forEach((label) => ctx.fillText(label.name, label.x, label.y));
    ctx.restore();
  },
};

// exports source features once so engine state can remain compact and immutable across frames
export const baseFeatures = districts.features;
export const stateOutline = state.features;
