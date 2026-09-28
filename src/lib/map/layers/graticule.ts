import type { Layer } from "../engine";

// draws the specified half-degree geographic reference grid into the cached map background
export const graticuleLayer: Layer = {
  id: "graticule",
  draw: (ctx, state) => {
    if (!state.layers.districts) return;
    const [west, south, east, north] = state.scenario.region.bbox;
    const startLon = Math.floor(west * 2) / 2;
    const startLat = Math.floor(south * 2) / 2;
    ctx.save();
    ctx.strokeStyle = state.theme.line;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    for (let lon = startLon; lon <= east; lon += 0.5) {
      ctx.beginPath();
      for (let lat = south; lat <= north; lat += 0.05) {
        const [x, y] = state.projection.project([lon, lat]);
        if (lat === south) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let lat = startLat; lat <= north; lat += 0.5) {
      ctx.beginPath();
      for (let lon = west; lon <= east; lon += 0.05) {
        const [x, y] = state.projection.project([lon, lat]);
        if (lon === west) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  },
};
