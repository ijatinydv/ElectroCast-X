import { cellRadiusPx } from "../project";
import { getSpriteSet } from "../sprites";
import type { Layer } from "../engine";

const fieldWidth = 96;
const fieldHeight = 64;
let field: HTMLCanvasElement | null = null;

// retains the fixed-resolution cloud-top field required for smooth, inexpensive satellite rendering
function satelliteField(): HTMLCanvasElement {
  field ??= Object.assign(document.createElement("canvas"), { width: fieldWidth, height: fieldHeight });
  return field;
}

// creates the satellite backing canvas before draw-time performance measurement begins
export function prepareSatelliteLayer(): void {
  satelliteField().getContext("2d");
}

// renders cool cloud-top contributions to a low-resolution field before one smoothed upscale
export const satelliteLayer: Layer = {
  id: "satellite",
  draw: (context, state) => {
    if (!state.layers.satellite || state.mapMode !== "satellite") return;
    const canvas = satelliteField();
    const fieldContext = canvas.getContext("2d");
    if (!fieldContext) return;
    const sprites = getSpriteSet(state.theme);
    fieldContext.clearRect(0, 0, fieldWidth, fieldHeight);
    for (const cell of state.frame.cells) {
      const center = state.projection.project(cell.centroid);
      const radius = Math.max(8, cellRadiusPx(cell, state.projection));
      const x = (center[0] / state.width) * fieldWidth;
      const y = (center[1] / state.height) * fieldHeight;
      const size = Math.max(10, (radius / state.width) * fieldWidth * 3.2);
      const coldTopStrength = Math.min(0.76, Math.max(0.16, (cell.cloudTopCoolingKmin + cell.echoTopKm / 10) / 4));
      fieldContext.globalAlpha = coldTopStrength;
      fieldContext.drawImage(sprites.cloudTop.medium, x - size, y - size, size * 2, size * 2);
    }

    context.imageSmoothingEnabled = true;
    context.globalAlpha = 1;
    context.drawImage(canvas, 0, 0, state.width, state.height);
  },
};
