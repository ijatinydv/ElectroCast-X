import type { Layer, MapFrameState } from "../engine";

// draws a projected polyline used to distinguish prepared forecast and outcome movement
function drawPath(context: CanvasRenderingContext2D, state: MapFrameState, points: readonly [number, number][]): void {
  const first = points[0];
  if (!first) return;
  const [startX, startY] = state.projection.project(first);
  context.beginPath();
  context.moveTo(startX, startY);
  for (const point of points.slice(1)) {
    const [x, y] = state.projection.project(point);
    context.lineTo(x, y);
  }
  context.stroke();
}

// draws the prepared predicted flash rings up to the active playback position
function drawPredictionFlashes(context: CanvasRenderingContext2D, state: MapFrameState): void {
  for (const flash of state.frame.lightning.filter((candidate) => candidate.tMin > 0 && candidate.tMin <= state.timeMin)) {
    const [x, y] = state.projection.project(flash.lonLat);
    context.beginPath();
    context.arc(x, y, 7, 0, Math.PI * 2);
    context.stroke();
  }
}

// draws prepared outcome path, observed cells, and solid flashes up to the active playback position
function drawObservedOutcome(context: CanvasRenderingContext2D, state: MapFrameState): void {
  context.strokeStyle = state.theme.observed;
  context.fillStyle = state.theme.observed;
  context.lineWidth = 2;
  drawPath(context, state, state.scenario.outcome.observedPath);
  for (const cell of state.frame.cells) {
    const [x, y] = state.projection.project(cell.centroid);
    context.globalAlpha = 0.6;
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.stroke();
  }
  context.globalAlpha = 1;
  for (const flash of state.scenario.outcome.observedFlashes.filter((candidate) => candidate.tMin <= state.timeMin)) {
    const [x, y] = state.projection.project(flash.lonLat);
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fill();
  }
}

// renders both retrospective sources into their respective clipped halves of one canvas
export const compareLayer: Layer = {
  id: "compare",
  draw: (context, state) => {
    if (!state.compareOn) return;
    const splitX = state.width * state.compareSplit;

    context.save();
    context.beginPath();
    context.rect(0, 0, splitX, state.height);
    context.clip();
    context.strokeStyle = state.theme.forecast;
    context.lineWidth = 1.5;
    drawPredictionFlashes(context, state);
    context.restore();

    context.save();
    context.beginPath();
    context.rect(splitX, 0, state.width - splitX, state.height);
    context.clip();
    drawObservedOutcome(context, state);
    context.restore();
  },
};
