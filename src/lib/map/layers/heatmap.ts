import type { Layer } from "../engine";

const gridWidth = 96;
const gridHeight = 64;
let heatGrid: HTMLCanvasElement | null = null;

// keeps the prescribed low-resolution lightning-density grid off the visible canvas
function flashGrid(): HTMLCanvasElement {
  heatGrid ??= Object.assign(document.createElement("canvas"), { width: gridWidth, height: gridHeight });
  return heatGrid;
}

// creates the flash-density backing canvas before draw-time performance measurement begins
export function prepareHeatmapLayer(): void {
  flashGrid().getContext("2d");
}

// accumulates prepared flash-density bins into amber coverage before a single smooth upscale
export const heatmapLayer: Layer = {
  id: "flash-density",
  draw: (context, state) => {
    if (!state.layers.flashDensity) return;
    const density = state.frame.flashDensity;
    const rows = density.length;
    const columns = density[0]?.length ?? 0;
    if (!rows || !columns) return;
    const grid = flashGrid();
    const gridContext = grid.getContext("2d");
    if (!gridContext) return;
    gridContext.clearRect(0, 0, gridWidth, gridHeight);
    gridContext.fillStyle = state.theme.risk;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const value = density[row]?.[column] ?? 0;
        const normalized = Math.max(0, (value - 0.22) / 0.32);
        if (normalized <= 0) continue;
        gridContext.globalAlpha = Math.min(0.55, normalized ** 0.9 * 0.55);
        gridContext.fillRect(column * gridWidth / columns, row * gridHeight / rows, gridWidth / columns, gridHeight / rows);
      }
    }

    context.imageSmoothingEnabled = true;
    context.globalAlpha = 1;
    context.drawImage(grid, 0, 0, state.width, state.height);
  },
};
