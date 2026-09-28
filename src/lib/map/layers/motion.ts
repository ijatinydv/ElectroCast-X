import type { Layer, MapFrameState } from "../engine";

// draws each storm's forecast direction and measured speed beside its cell centre
export const motionLayer: Layer = {
  id: "motion",
  draw: (context, state) => {
    for (const cell of state.frame.cells) {
      const [x, y] = state.projection.project(cell.centroid);
      const radians = (cell.motion.dirDeg - 90) * Math.PI / 180;
      const length = 22;
      const endX = x + Math.cos(radians) * length;
      const endY = y + Math.sin(radians) * length;
      const wing = 5;

      context.strokeStyle = state.theme.forecast;
      context.fillStyle = state.theme.forecast;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(endX, endY);
      context.stroke();
      context.beginPath();
      context.moveTo(endX, endY);
      context.lineTo(endX - Math.cos(radians - Math.PI / 6) * wing, endY - Math.sin(radians - Math.PI / 6) * wing);
      context.lineTo(endX - Math.cos(radians + Math.PI / 6) * wing, endY - Math.sin(radians + Math.PI / 6) * wing);
      context.closePath();
      context.fill();

      context.font = `11px ${state.theme.fontMono}`;
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(`${cell.motion.speedKmh} km/h`, endX + 6, endY);
    }
  },
};
