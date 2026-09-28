import type { Layer } from "../engine";

// draws each prepared storm motion vector and its data-supplied ground speed
export const motionLayer: Layer = {
  id: "motion",
  draw: (ctx, state) => {
    for (const cell of state.frame.cells) {
      const [x, y] = state.projection.project(cell.centroid);
      const radians = (cell.motion.dirDeg * Math.PI) / 180;
      const length = 22;
      const endX = x + (Math.sin(radians) * length);
      const endY = y - (Math.cos(radians) * length);
      const selected = state.selectedCellId === cell.id;

      ctx.save();
      ctx.globalAlpha = state.selectedCellId === null || selected ? 0.85 : 0.35;
      ctx.strokeStyle = state.theme.foregroundSecondary;
      ctx.fillStyle = state.theme.foregroundSecondary;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.lineTo(endX - (Math.sin(radians - 0.55) * 5), endY + (Math.cos(radians - 0.55) * 5));
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - (Math.sin(radians + 0.55) * 5), endY + (Math.cos(radians + 0.55) * 5));
      ctx.stroke();
      ctx.font = `10px ${state.theme.fontMono}`;
      ctx.textBaseline = "top";
      ctx.fillText(`${Math.round(cell.motion.speedKmh)} km/h`, x + 5, y + 7);
      ctx.restore();
    }
  },
};
