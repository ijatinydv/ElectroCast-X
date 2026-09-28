import type { Layer } from "../engine";

const distancesKm = [1, 2, 5, 10, 20, 50, 100, 200] as const;

// chooses a restrained rounded scale distance that occupies roughly a fifth of the map width
function scaleDistanceKm(state: Parameters<Layer["draw"]>[1]): number {
  const center = state.scenario.region.center;
  const [x] = state.projection.project(center);
  const [oneDegreeX] = state.projection.project([center[0] + 1, center[1]]);
  const pixelsPerKm = Math.abs(oneDegreeX - x) / (111.32 * Math.cos(center[1] * Math.PI / 180));
  const target = state.width * 0.16;
  return distancesKm.reduce((best, candidate) => (
    Math.abs(candidate * pixelsPerKm - target) < Math.abs(best * pixelsPerKm - target) ? candidate : best
  ), distancesKm[0]);
}

// renders a compact instrument scale reference at the lower right of the map cache
export const scaleBarLayer: Layer = {
  id: "scale-bar",
  draw: (ctx, state) => {
    const km = scaleDistanceKm(state);
    const center = state.scenario.region.center;
    const [originX] = state.projection.project(center);
    const [oneDegreeX] = state.projection.project([center[0] + 1, center[1]]);
    const pixelsPerKm = Math.abs(oneDegreeX - originX) / (111.32 * Math.cos(center[1] * Math.PI / 180));
    const length = km * pixelsPerKm;
    const x = state.width - length - 20;
    const y = state.height - 22;
    ctx.save();
    ctx.strokeStyle = state.theme.fg3;
    ctx.fillStyle = state.theme.fg3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y);
    ctx.moveTo(x, y - 3);
    ctx.lineTo(x, y + 3);
    ctx.moveTo(x + length, y - 3);
    ctx.lineTo(x + length, y + 3);
    ctx.stroke();
    ctx.font = "11px var(--font-mono)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${km} km`, x + length, y - 5);
    ctx.restore();
  },
};
