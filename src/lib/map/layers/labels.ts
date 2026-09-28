import { cellRadiusPx } from "../project";
import type { Layer, MapFrameState } from "../engine";

// keeps storm identifiers and the selected-cell ring legible above forecast overlays
export const labelsLayer: Layer = {
  id: "labels",
  draw: (context, state) => {
    for (const cell of state.frame.cells) {
      const [x, y] = state.projection.project(cell.centroid);
      const radius = Math.max(12, cellRadiusPx(cell, state.projection));
      if (cell.id === state.selectedCellId) {
        context.beginPath();
        context.arc(x, y, radius + 4, 0, Math.PI * 2);
        context.strokeStyle = state.theme.foreground;
        context.lineWidth = 1;
        context.stroke();
      }
      context.fillStyle = state.theme.foreground;
      context.font = `11px ${state.theme.fontMono}`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillText(cell.id, x, y - radius - 7);
    }
  },
};
