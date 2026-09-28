import type { Layer } from "../engine";
import { cellRadiusPx } from "../project";

// labels prepared cells and indicates the single globally-selected cell without DOM overlays
export const labelsLayer: Layer = {
  id: "cell-labels",
  draw: (ctx, state) => {
    for (const cell of state.frame.cells) {
      const [x, y] = state.projection.project(cell.centroid);
      const radius = cellRadiusPx(cell, state.projection);
      const selected = state.selectedCellId === cell.id;
      ctx.save();
      if (selected) {
        ctx.strokeStyle = state.theme.foreground;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = selected ? state.theme.foreground : state.theme.foregroundSecondary;
      ctx.font = `10px ${state.theme.fontMono}`;
      ctx.textBaseline = "bottom";
      ctx.fillText(cell.id, x + radius + 5, y - 4);
      ctx.restore();
    }
  },
};
