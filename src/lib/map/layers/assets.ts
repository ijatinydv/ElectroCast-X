import { corridorFor } from "@/lib/derive";
import { getSyntheticAssets } from "@/lib/geo/load";
import type { AssetLocation, PolylineAsset } from "@/types/assets";
import type { Layer, MapFrameState } from "../engine";
import type { ScreenPoint } from "../project";

// identifies the independently switchable exposure domains used by the map layer
type ExposureLayerId = "population" | "schools" | "hospitals" | "airports" | "powerLines" | "mines" | "outdoorEvents";

// carries the display data required by the DOM tooltip without duplicating source asset data
export interface AssetTooltip {
  id: string;
  name: string;
  type: string;
  population?: number;
  synthetic: boolean;
  point: ScreenPoint;
}

// stores the two semantic colour variants of each pre-rendered twelve-pixel asset glyph
type AssetSprites = Record<"neutral" | "risk", Record<"school" | "hospital" | "airport" | "pylon" | "mine" | "event", HTMLCanvasElement>>;

// retains a compact low-resolution field until the map dimensions or projection change
interface PopulationField {
  key: string;
  canvas: HTMLCanvasElement;
}

// reads the immutable prepared synthetic exposure fixture once for all canvas frames
const assets = getSyntheticAssets();

// resolves a panel selection to its prepared map coordinate for refitting and pulsing
export function assetLocation(assetId: string): [number, number] | null {
  const point = assets.points.find((asset) => asset.id === assetId);
  if (point) return point.lonLat;
  const line = assets.polylines.find((asset) => asset.id === assetId);
  if (!line) return null;
  return line.path[Math.floor(line.path.length / 2)] ?? null;
}

// preserves the required twelve-pixel footprint for every point exposure glyph
const glyphSize = 12;

// constrains density preparation to a low-cost field resolution
const fieldWidth = 96;

// constrains density preparation to a low-cost field resolution
const fieldHeight = 64;

// retains canvas glyphs after their first pre-render for future map frames
let sprites: AssetSprites | null = null;

// retains the current low-resolution population raster between map frames
let populationField: PopulationField | null = null;

// maps stored asset types to their corresponding independent map switch
function layerForAsset(asset: AssetLocation): Exclude<ExposureLayerId, "population" | "powerLines"> {
  const layers = { school: "schools", hospital: "hospitals", airport: "airports", mine: "mines", event: "outdoorEvents" } as const;
  return layers[asset.type as keyof typeof layers];
}

// tests point membership against the selected outer corridor including its boundary
export function pointInPolygon(point: readonly [number, number], polygon: readonly [number, number][]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const prior = polygon[previous];
    if (!current || !prior) continue;
    const [x, y] = point;
    const [xi, yi] = current;
    const [xj, yj] = prior;
    const crosses = (yi > y) !== (yj > y);
    const intersectX = ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses && x <= intersectX) inside = !inside;
  }
  return inside;
}

// returns the active selected cell's 30-minute outer corridor when corridor highlighting is possible
function selectedOuterCorridor(state: MapFrameState): readonly [number, number][] | null {
  const cell = state.frame.cells.find((candidate) => candidate.id === state.selectedCellId);
  return cell ? corridorFor(cell, 30, state.corridorScale).outer : null;
}

// creates a transparent canvas that keeps individual glyph paths out of the animation loop
function createGlyph(color: string, kind: keyof AssetSprites["neutral"]): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = glyphSize;
  canvas.height = glyphSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1.25;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.translate(0.5, 0.5);
  context.beginPath();
  if (kind === "school") {
    context.moveTo(1, 5); context.lineTo(6, 1); context.lineTo(11, 5); context.lineTo(10, 5); context.lineTo(10, 11); context.lineTo(2, 11); context.lineTo(2, 5); context.closePath();
    context.moveTo(5, 11); context.lineTo(5, 7); context.lineTo(7, 7); context.lineTo(7, 11);
  } else if (kind === "hospital") {
    context.moveTo(6, 2); context.lineTo(6, 10); context.moveTo(2, 6); context.lineTo(10, 6);
  } else if (kind === "airport") {
    context.moveTo(1, 6); context.lineTo(11, 6); context.moveTo(6, 6); context.lineTo(3, 2); context.moveTo(6, 6); context.lineTo(3, 10); context.moveTo(8, 6); context.lineTo(10, 4); context.moveTo(8, 6); context.lineTo(10, 8);
  } else if (kind === "pylon") {
    context.moveTo(6, 1); context.lineTo(2, 11); context.moveTo(6, 1); context.lineTo(10, 11); context.moveTo(3, 5); context.lineTo(9, 5); context.moveTo(1, 8); context.lineTo(11, 8); context.moveTo(4, 11); context.lineTo(8, 11);
  } else if (kind === "mine") {
    context.moveTo(1, 10); context.lineTo(4, 5); context.lineTo(6, 7); context.lineTo(9, 2); context.lineTo(11, 3); context.lineTo(7, 10); context.closePath();
  } else {
    context.moveTo(2, 3); context.lineTo(10, 3); context.lineTo(11, 9); context.lineTo(3, 9); context.closePath();
    context.moveTo(4, 3); context.lineTo(4, 9); context.moveTo(8, 3); context.lineTo(8, 9);
  }
  context.stroke();
  return canvas;
}

// builds both neutral and warning glyph sets once after map theme tokens become available
function getAssetSprites(state: MapFrameState): AssetSprites {
  if (sprites) return sprites;
  const kinds = ["school", "hospital", "airport", "pylon", "mine", "event"] as const;
  const build = (color: string) => Object.fromEntries(kinds.map((kind) => [kind, createGlyph(color, kind)])) as AssetSprites["neutral"];
  sprites = { neutral: build(state.theme.foregroundSecondary), risk: build(state.theme.risk) };
  return sprites;
}

// generates a population-weighted soft field from villages on a compact offscreen raster
function getPopulationField(state: MapFrameState): HTMLCanvasElement {
  const key = [state.width, state.height, state.projection.scale, ...state.projection.translate].join(":");
  if (populationField?.key === key) return populationField.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = fieldWidth;
  canvas.height = fieldHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");
  const image = context.createImageData(fieldWidth, fieldHeight);
  const density = new Float32Array(fieldWidth * fieldHeight);
  const villages = assets.points.filter((asset) => asset.type === "village");
  for (const village of villages) {
    const [screenX, screenY] = state.projection.project(village.lonLat);
    const centreX = screenX / state.width * fieldWidth;
    const centreY = screenY / state.height * fieldHeight;
    const strength = Math.max(0.25, Math.min(1, (village.population ?? 0) / 8000));
    for (let y = Math.max(0, Math.floor(centreY - 6)); y <= Math.min(fieldHeight - 1, Math.ceil(centreY + 6)); y += 1) {
      for (let x = Math.max(0, Math.floor(centreX - 6)); x <= Math.min(fieldWidth - 1, Math.ceil(centreX + 6)); x += 1) {
        const distanceSquared = (x - centreX) ** 2 + (y - centreY) ** 2;
        const index = y * fieldWidth + x;
        density[index] = (density[index] ?? 0) + strength * Math.exp(-distanceSquared / 12);
      }
    }
  }
  for (let index = 0; index < density.length; index += 1) {
    const alpha = Math.min(0.18, density[index]! * 0.08);
    image.data[index * 4] = 152;
    image.data[index * 4 + 1] = 163;
    image.data[index * 4 + 2] = 179;
    image.data[index * 4 + 3] = Math.round(alpha * 255);
  }
  context.putImageData(image, 0, 0);
  populationField = { key, canvas };
  return canvas;
}

// draws the low-opacity village density field without creating population markers
function drawPopulation(context: CanvasRenderingContext2D, state: MapFrameState): void {
  if (!state.layers.population) return;
  context.save();
  context.imageSmoothingEnabled = true;
  context.drawImage(getPopulationField(state), 0, 0, state.width, state.height);
  context.restore();
}

// identifies transmission segments exposed to the selected corridor for drawing and test coverage
export function segmentIsInsideCorridor(start: readonly [number, number], end: readonly [number, number], corridor: readonly [number, number][] | null): boolean {
  if (!corridor) return false;
  const midpoint: [number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  return pointInPolygon(start, corridor) || pointInPolygon(end, corridor) || pointInPolygon(midpoint, corridor);
}

// draws transmission paths segment by segment so corridor-exposed portions alone become amber
function drawTransmission(context: CanvasRenderingContext2D, state: MapFrameState, corridor: readonly [number, number][] | null): void {
  if (!state.layers.powerLines) return;
  for (const line of assets.polylines) {
    for (let index = 1; index < line.path.length; index += 1) {
      const start = line.path[index - 1];
      const end = line.path[index];
      if (!start || !end) continue;
      const highlighted = segmentIsInsideCorridor(start, end, corridor);
      const [startX, startY] = state.projection.project(start);
      const [endX, endY] = state.projection.project(end);
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.strokeStyle = highlighted ? state.theme.risk : state.theme.foregroundSecondary;
      context.globalAlpha = 0.8;
      context.lineWidth = 1;
      context.stroke();
    }
  }
  context.globalAlpha = 1;
}

// draws visible point assets from cached sprites, applying warning colour only inside the selected corridor
function drawPointAssets(context: CanvasRenderingContext2D, state: MapFrameState, corridor: readonly [number, number][] | null): void {
  const assetSprites = getAssetSprites(state);
  for (const asset of assets.points) {
    if (asset.type === "village" || !state.layers[layerForAsset(asset)]) continue;
    const highlighted = corridor !== null && pointInPolygon(asset.lonLat, corridor);
    const kind = asset.type === "school" ? "school" : asset.type === "hospital" ? "hospital" : asset.type === "airport" ? "airport" : asset.type === "mine" ? "mine" : "event";
    const [x, y] = state.projection.project(asset.lonLat);
    context.drawImage(assetSprites[highlighted ? "risk" : "neutral"][kind], Math.round(x - glyphSize / 2), Math.round(y - glyphSize / 2));
  }
}

// computes squared screen distance to keep asset hit tests allocation-free during pointer movement
function segmentDistanceSquared(point: ScreenPoint, start: ScreenPoint, end: ScreenPoint): number {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];
  const lengthSquared = deltaX ** 2 + deltaY ** 2;
  const progress = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - start[0]) * deltaX + (point[1] - start[1]) * deltaY) / lengthSquared));
  return (point[0] - (start[0] + progress * deltaX)) ** 2 + (point[1] - (start[1] + progress * deltaY)) ** 2;
}

// converts an asset record into the intentionally labelled tooltip content shown outside the canvas
function tooltipFor(asset: AssetLocation | PolylineAsset, point: ScreenPoint): AssetTooltip {
  const names = { village: "Population", school: "School", hospital: "Hospital", airport: "Airport", mine: "Mine", event: "Outdoor event", transmission: "Power line" } as const;
  return { id: asset.id, name: asset.name, type: names[asset.type], population: "population" in asset ? asset.population : undefined, synthetic: asset.synthetic, point };
}

// finds the nearest currently visible point or power line for the map's hover tooltip
export function hitTestAsset(state: MapFrameState, point: ScreenPoint): AssetTooltip | null {
  let nearest: { tooltip: AssetTooltip; distanceSquared: number } | null = null;
  for (const asset of assets.points) {
    if (asset.type === "village" || !state.layers[layerForAsset(asset)]) continue;
    const projected = state.projection.project(asset.lonLat);
    const distanceSquared = (point[0] - projected[0]) ** 2 + (point[1] - projected[1]) ** 2;
    if (distanceSquared <= 64 && (!nearest || distanceSquared < nearest.distanceSquared)) nearest = { tooltip: tooltipFor(asset, projected), distanceSquared };
  }
  if (state.layers.powerLines) {
    for (const line of assets.polylines) {
      for (let index = 1; index < line.path.length; index += 1) {
        const start = line.path[index - 1];
        const end = line.path[index];
        if (!start || !end) continue;
        const distanceSquared = segmentDistanceSquared(point, state.projection.project(start), state.projection.project(end));
        if (distanceSquared <= 36 && (!nearest || distanceSquared < nearest.distanceSquared)) nearest = { tooltip: tooltipFor(line, point), distanceSquared };
      }
    }
  }
  return nearest?.tooltip ?? null;
}

// renders optional synthetic exposure layers above forecasts while preserving the established map order
export const assetsLayer: Layer = {
  id: "assets",
  draw: (context, state) => {
    const corridor = selectedOuterCorridor(state);
    drawPopulation(context, state);
    drawTransmission(context, state, corridor);
    drawPointAssets(context, state, corridor);
  },
};
