import type { Layer, MapFrameState } from "../engine";

// draws a restrained distance reference that adapts to the active map projection
export const scaleBarLayer: Layer = {
  id: "scale-bar",
  draw: (ctx, state) => {
    const [west, south] = state.scenario.region.bbox;
    const origin: [number, number] = [west + 0.25, south + 0.25];
    const kilometres = scaleKilometres(state, origin);
    const longitudeDelta = kilometres / (111.32 * Math.cos((origin[1] * Math.PI) / 180));
    const [startX, projectedY] = state.projection.project(origin);
    const [endX] = state.projection.project([origin[0] + longitudeDelta, origin[1]]);
    const y = Math.min(state.height - 20, Math.max(20, projectedY));
    ctx.strokeStyle = state.theme.foregroundTertiary;
    ctx.fillStyle = state.theme.foregroundTertiary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, y); ctx.lineTo(endX, y);
    ctx.moveTo(startX, y - 3); ctx.lineTo(startX, y + 3);
    ctx.moveTo(endX, y - 3); ctx.lineTo(endX, y + 3);
    ctx.stroke();
    ctx.font = `10px ${state.theme.fontSans}`;
    ctx.textBaseline = "bottom";
    ctx.fillText(`${kilometres} km`, startX, y - 5);
  },
};

// selects a conventional distance whose projected width stays compact
function scaleKilometres(state: MapFrameState, origin: readonly [number, number]): number {
  return [10, 20, 50, 100, 200].reduce((chosen, candidate) => {
    const delta = candidate / (111.32 * Math.cos((origin[1] * Math.PI) / 180));
    const [startX] = state.projection.project(origin);
    const [endX] = state.projection.project([origin[0] + delta, origin[1]]);
    return endX - startX <= state.width * 0.2 ? candidate : chosen;
  }, 10);
}
