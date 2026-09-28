import type { Layer } from "../engine";

const gridWidth = 96;
const gridHeight = 64;
let gridCanvas: HTMLCanvasElement | null = null;
let gridContext: CanvasRenderingContext2D | null = null;

// turns the prepared flash-density samples into a smooth amber low-resolution accumulation grid
export const heatmapLayer: Layer = {
  id: "flash-density",
  draw: (ctx, state) => {
    if (!state.layers.flashDensity) return;
    const grid = getGridContext();
    const source = state.frame.flashDensity;
    const sourceHeight = source.length;
    const sourceWidth = source[0]?.length ?? 0;
    if (!sourceHeight || !sourceWidth) return;
    const pixels = grid.createImageData(gridWidth, gridHeight);

    for (let y = 0; y < gridHeight; y += 1) for (let x = 0; x < gridWidth; x += 1) {
      const density = sampleDensity(source, (x / (gridWidth - 1)) * (sourceWidth - 1), (y / (gridHeight - 1)) * (sourceHeight - 1));
      const alpha = Math.min(0.68, density * 1.25);
      const index = (y * gridWidth + x) * 4;
      pixels.data[index] = 245;
      pixels.data[index + 1] = 169;
      pixels.data[index + 2] = 74;
      pixels.data[index + 3] = Math.round(alpha * 255);
    }
    grid.putImageData(pixels, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(grid.canvas, 0, 0, state.width, state.height);
    ctx.restore();
  },
};

// interpolates prepared samples, retaining their fractional intensity while the timeline is scrubbed
function sampleDensity(source: readonly (readonly number[])[], x: number, y: number): number {
  const left = Math.floor(x); const right = Math.min(left + 1, source[0]!.length - 1);
  const top = Math.floor(y); const bottom = Math.min(top + 1, source.length - 1);
  const horizontal = x - left; const vertical = y - top;
  const upper = source[top]![left]! * (1 - horizontal) + source[top]![right]! * horizontal;
  const lower = source[bottom]![left]! * (1 - horizontal) + source[bottom]![right]! * horizontal;
  return upper * (1 - vertical) + lower * vertical;
}

// defers DOM canvas construction until the map runs in the browser
function getGridContext(): CanvasRenderingContext2D & { canvas: HTMLCanvasElement } {
  if (!gridCanvas || !gridContext) {
    gridCanvas = document.createElement("canvas");
    gridCanvas.width = gridWidth;
    gridCanvas.height = gridHeight;
    gridContext = gridCanvas.getContext("2d");
    if (!gridContext) throw new Error("Heatmap grid canvas 2D context is unavailable");
  }
  return gridContext as CanvasRenderingContext2D & { canvas: HTMLCanvasElement };
}
