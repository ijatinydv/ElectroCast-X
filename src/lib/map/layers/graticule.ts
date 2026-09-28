import type { Layer, MapFrameState } from "../engine";

// draws the faint half-degree geographic reference grid beneath the boundaries
export const graticuleLayer: Layer = {
  id: "graticule",
  draw: (ctx, state) => {
    const [west, south, east, north] = state.scenario.region.bbox;
    ctx.beginPath();
    ctx.strokeStyle = state.theme.line;
    ctx.lineWidth = 1;
    for (let longitude = gridStart(west); longitude <= east; longitude += 0.5) drawLongitude(ctx, state, longitude, south, north);
    for (let latitude = gridStart(south); latitude <= north; latitude += 0.5) drawLatitude(ctx, state, latitude, west, east);
    ctx.stroke();
  },
};

// aligns a grid start to a half-degree coordinate
function gridStart(value: number): number { return Math.ceil(value * 2) / 2; }

// traces one longitude through the current mercator projection
function drawLongitude(ctx: CanvasRenderingContext2D, state: MapFrameState, longitude: number, south: number, north: number): void {
  drawSegmentedLine(ctx, state, 12, (step, steps) => [longitude, south + ((north - south) * step) / steps]);
}

// traces one latitude through the current mercator projection
function drawLatitude(ctx: CanvasRenderingContext2D, state: MapFrameState, latitude: number, west: number, east: number): void {
  drawSegmentedLine(ctx, state, 12, (step, steps) => [west + ((east - west) * step) / steps, latitude]);
}

// draws a projected geographic line from a small sequence of coordinate samples
function drawSegmentedLine(ctx: CanvasRenderingContext2D, state: MapFrameState, steps: number, coordinateAt: (step: number, steps: number) => readonly [number, number]): void {
  for (let step = 0; step <= steps; step += 1) {
    const [x, y] = state.projection.project(coordinateAt(step, steps));
    if (step === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}
