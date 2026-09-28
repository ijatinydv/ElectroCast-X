import type { Layer } from "../engine";

const fieldWidth = 96;
const fieldHeight = 64;
let fieldCanvas: HTMLCanvasElement | null = null;
let fieldContext: CanvasRenderingContext2D | null = null;

// renders a deliberately low-resolution cool-top field that is smoothly enlarged by the browser
export const satelliteLayer: Layer = {
  id: "satellite",
  draw: (ctx, state) => {
    if (state.mapMode !== "satellite" || !state.layers.satellite) return;
    const field = getFieldContext();
    const pixels = field.createImageData(fieldWidth, fieldHeight);
    const [west, south, east, north] = state.scenario.region.bbox;

    for (const cell of state.frame.cells) {
      const x = ((cell.centroid[0] - west) / (east - west)) * fieldWidth;
      const y = ((north - cell.centroid[1]) / (north - south)) * fieldHeight;
      const coldness = Math.max(0, Math.min(1, (cell.echoTopKm - 7) / 9));
      const spread = 5 + cell.radiusKm * 0.35;
      addGaussian(pixels.data, x, y, spread, coldness);
    }

    field.putImageData(pixels, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.72;
    ctx.drawImage(field.canvas, 0, 0, state.width, state.height);
    ctx.restore();
  },
};

// adds a cyan cool-top contribution to the small field; it runs over only 6,144 pixels per cell
function addGaussian(data: Uint8ClampedArray, centerX: number, centerY: number, spread: number, strength: number): void {
  const minX = Math.max(0, Math.floor(centerX - spread * 3));
  const maxX = Math.min(fieldWidth - 1, Math.ceil(centerX + spread * 3));
  const minY = Math.max(0, Math.floor(centerY - spread * 3));
  const maxY = Math.min(fieldHeight - 1, Math.ceil(centerY + spread * 3));
  for (let y = minY; y <= maxY; y += 1) for (let x = minX; x <= maxX; x += 1) {
    const value = strength * Math.exp(-((x - centerX) ** 2 + (y - centerY) ** 2) / (2 * spread ** 2));
    const index = (y * fieldWidth + x) * 4;
    data[index] = Math.min(92, data[index]! + value * 52);
    data[index + 1] = Math.min(225, data[index + 1]! + value * 186);
    data[index + 2] = Math.min(255, data[index + 2]! + value * 218);
    data[index + 3] = Math.min(220, data[index + 3]! + value * 180);
  }
}

// creates the reusable field canvas lazily because this module also participates in server builds
function getFieldContext(): CanvasRenderingContext2D & { canvas: HTMLCanvasElement } {
  if (!fieldCanvas || !fieldContext) {
    fieldCanvas = document.createElement("canvas");
    fieldCanvas.width = fieldWidth;
    fieldCanvas.height = fieldHeight;
    fieldContext = fieldCanvas.getContext("2d");
    if (!fieldContext) throw new Error("Satellite field canvas 2D context is unavailable");
  }
  return fieldContext as CanvasRenderingContext2D & { canvas: HTMLCanvasElement };
}
