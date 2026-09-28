import { corridorFor, type CorridorHorizon, type Polygon } from "@/lib/derive/corridor";
import type { Layer, MapFrameState } from "../engine";

const horizons: readonly CorridorHorizon[] = ["15", "30", "60"];

// renders nested forecast uncertainty geometry while preserving the prepared corridor data
export const corridorsLayer: Layer = {
  id: "corridors",
  draw: (ctx, state) => {
    if (!state.layers.corridors) return;

    for (const cell of state.frame.cells) {
      const selected = state.selectedCellId === cell.id;
      const emphasis = state.selectedCellId === null || selected ? 1 : 0.3;
      for (const horizon of horizons) {
        const corridor = corridorFor(cell, horizon, state.corridorScale);
        ctx.save();
        ctx.globalAlpha = emphasis;
        drawPolygon(ctx, state, corridor.outer);
        ctx.fillStyle = state.theme.forecast;
        ctx.globalAlpha = emphasis * 0.08;
        ctx.fill();
        ctx.globalAlpha = emphasis;
        ctx.strokeStyle = state.theme.forecast;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        drawPolygon(ctx, state, corridor.inner);
        ctx.fillStyle = state.theme.forecast;
        ctx.globalAlpha = emphasis * 0.16;
        ctx.fill();

        const destination = polygonCenter(corridor.center);
        const [startX, startY] = state.projection.project(cell.centroid);
        const [endX, endY] = state.projection.project(destination);
        ctx.globalAlpha = emphasis;
        ctx.setLineDash([]);
        ctx.strokeStyle = state.theme.forecast;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.font = `10px ${state.theme.fontMono}`;
        ctx.fillStyle = state.theme.forecast;
        ctx.textBaseline = "bottom";
        ctx.fillText(`+${horizon}`, endX + 5, endY - 4);
        ctx.restore();
      }
    }
  },
};

// builds a closed canvas path from a geographic corridor boundary
function drawPolygon(ctx: CanvasRenderingContext2D, state: MapFrameState, polygon: Polygon): void {
  ctx.beginPath();
  polygon.forEach((point, index) => {
    const [x, y] = state.projection.project(point);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

// finds a label anchor for the prepared centre-path geometry without inventing forecast coordinates
function polygonCenter(polygon: Polygon): [number, number] {
  const total = polygon.reduce<[number, number]>((sum, [lon, lat]) => [sum[0] + lon, sum[1] + lat], [0, 0]);
  return [total[0] / polygon.length, total[1] / polygon.length];
}
