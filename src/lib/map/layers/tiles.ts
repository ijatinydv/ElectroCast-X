// renders CartoDB Dark Matter OSM tiles as the geographic base of the mission control map
import type { Layer, MapFrameState } from "../engine";

// tile image cache to avoid re-fetching tiles that have already loaded
const tileCache = new Map<string, HTMLImageElement | "loading" | "error">();

// converts Web Mercator projection parameters to OSM tile coordinates
function lonLatToTile(lon: number, lat: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return [x, y];
}

// converts OSM tile index back to the top-left longitude/latitude corner
function tileToLonLat(x: number, y: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return [lon, lat];
}

// determines an appropriate tile zoom level from the map projection scale
function projectionZoom(scale: number): number {
  // d3 mercator scale at zoom z ≈ 256 * 2^z / (2 * Math.PI)
  const z = Math.log2((scale * 2 * Math.PI) / 256);
  return Math.max(5, Math.min(12, Math.round(z)));
}

// loads a tile image, caching and triggering a canvas repaint when ready
function loadTile(url: string, onLoad: () => void): HTMLImageElement | null {
  const cached = tileCache.get(url);
  if (cached instanceof HTMLImageElement) return cached;
  if (cached === "loading" || cached === "error") return null;
  tileCache.set(url, "loading");
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    tileCache.set(url, img);
    onLoad();
  };
  img.onerror = () => {
    tileCache.set(url, "error");
  };
  img.src = url;
  return null;
}

// holds a callback to request a new animation frame when a tile finishes loading
let repaintCallback: (() => void) | null = null;

// allows the map engine to register a repaint trigger for async tile loads
export function setTileRepaintCallback(fn: () => void): void {
  repaintCallback = fn;
}

// ESRI World Imagery — free satellite tiles, no API key required
// Note: ESRI uses {z}/{y}/{x} order (y and x are swapped vs standard OSM)
const TILE_BASE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

// draws ESRI satellite imagery tiles aligned to the current d3 mercator projection
export const tileLayer: Layer = {
  id: "tiles",
  draw: (ctx, state) => {
    const zoom = projectionZoom(state.projection.scale);
    const tileSize = 256;

    // find which tiles are visible in the current viewport
    // unproject the four canvas corners to get the lon/lat bounds
    const topLeft = state.projection.unproject([0, 0]);
    const bottomRight = state.projection.unproject([state.width, state.height]);
    if (!topLeft || !bottomRight) return;

    const [west, north] = topLeft;
    const [east, south] = bottomRight;

    const [xMin, yMin] = lonLatToTile(
      Math.max(-180, west - 1),
      Math.min(85, north + 1),
      zoom
    );
    const [xMax, yMax] = lonLatToTile(
      Math.min(180, east + 1),
      Math.max(-85, south - 1),
      zoom
    );

    const n = Math.pow(2, zoom);

    for (let tx = xMin; tx <= Math.min(xMax, n - 1); tx++) {
      for (let ty = yMin; ty <= Math.min(yMax, n - 1); ty++) {
        const [tileLon, tileLat] = tileToLonLat(tx, ty, zoom);
        const [tileRight, tileBottom] = tileToLonLat(tx + 1, ty + 1, zoom);

        // project tile corners to screen pixels
        const [px1, py1] = state.projection.project([tileLon, tileLat]);
        const [px2, py2] = state.projection.project([tileRight, tileBottom]);

        const drawW = px2 - px1;
        const drawH = py2 - py1;

        if (drawW <= 0 || drawH <= 0) continue;

        // ESRI World Imagery — free satellite tiles (y and x are swapped in ESRI format)
        const url = `${TILE_BASE}/${zoom}/${ty}/${tx}`;

        const img = loadTile(url, () => {
          repaintCallback?.();
        });

        if (img) {
          ctx.drawImage(img, px1, py1, drawW, drawH);
        } else {
          // placeholder while loading — subtle dark fill
          ctx.fillStyle = "#080e17";
          ctx.fillRect(px1, py1, drawW, drawH);
        }
      }
    }

    // subtle dark tint to unify satellite imagery with the dark UI theme
    ctx.fillStyle = "rgba(6, 9, 15, 0.18)";
    ctx.fillRect(0, 0, state.width, state.height);
  },
};
