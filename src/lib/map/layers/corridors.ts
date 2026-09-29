import { corridorFor } from "@/lib/derive";
import type { Cell } from "@/types/scenario";
import type { Layer, MapFrameState } from "../engine";

// fixes the forecast horizons that share a single consistent corridor treatment
const horizons = [15, 30, 60] as const;

// traces one geographic polygon through the active canvas projection
function tracePolygon(context: CanvasRenderingContext2D, state: MapFrameState, polygon: readonly [number, number][]): void {
  const first = polygon[0];
  if (!first) return;
  const [startX, startY] = state.projection.project(first);
  context.moveTo(startX, startY);
  polygon.slice(1).forEach((point) => {
    const [x, y] = state.projection.project(point);
    context.lineTo(x, y);
  });
  context.closePath();
}

// renders one cell's nested forecast geometry with its label at the projected path end
function drawCellCorridors(context: CanvasRenderingContext2D, state: MapFrameState, cell: Cell, opacity: number): void {
  for (const horizon of horizons) {
    const corridor = corridorFor(cell, horizon, state.corridorScale);

    context.beginPath();
    tracePolygon(context, state, corridor.outer);
    context.fillStyle = state.theme.forecast;
    context.globalAlpha = opacity * 0.08;
    context.fill();
    context.globalAlpha = opacity;
    context.setLineDash([4, 4]);
    context.strokeStyle = state.theme.forecast;
    context.lineWidth = 1;
    context.stroke();
    context.setLineDash([]);

    context.beginPath();
    tracePolygon(context, state, corridor.inner);
    context.fillStyle = state.theme.forecast;
    context.globalAlpha = opacity * 0.16;
    context.fill();

    context.beginPath();
    tracePolygon(context, state, corridor.center);
    context.globalAlpha = opacity;
    context.strokeStyle = state.theme.forecast;
    context.lineWidth = 2;
    context.stroke();

    const endpoint = corridor.center.at(-1);
    if (endpoint) {
      const [x, y] = state.projection.project(endpoint);
      context.fillStyle = state.theme.forecast;
      context.font = `11px ${state.theme.fontMono}`;
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(`${horizon} min`, x + 6, y);
    }
  }
  context.globalAlpha = 1;
}

// outlines the operator-selected inner corridor while the warning composer is open
function drawAlertCorridor(context: CanvasRenderingContext2D, state: MapFrameState, cell: Cell): void {
  const corridor = corridorFor(cell, state.alertHorizon, state.corridorScale);
  context.beginPath();
  tracePolygon(context, state, corridor.inner);
  context.strokeStyle = state.theme.risk;
  context.lineWidth = 2;
  context.globalAlpha = 1;
  context.stroke();
}

// draws selected-cell corridors at full strength while retaining contextual storm paths
export const corridorsLayer: Layer = {
  id: "corridors",
  draw: (context, state) => {
    if (!state.layers.corridors) return;
    for (const cell of state.frame.cells) {
      drawCellCorridors(context, state, cell, cell.id === state.selectedCellId ? 1 : 0.38);
      if (state.alertOpen && cell.id === state.selectedCellId) drawAlertCorridor(context, state, cell);
    }
  },
};
