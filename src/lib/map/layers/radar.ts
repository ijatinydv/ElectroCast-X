import { cellRadiusPx } from "../project";
import { getSpriteSet, type SpriteBand } from "../sprites";
import type { Layer } from "../engine";

// turns stable cell identifiers into repeatable variation without storing per-cell animation state
function seedFor(id: string, index = 0): number {
  let seed = 2166136261 + index;
  for (let position = 0; position < id.length; position += 1) seed = Math.imul(seed ^ id.charCodeAt(position), 16777619);
  return (seed >>> 0) / 4294967295;
}

// selects a cached sprite resolution that stays sharp as a projected storm cell grows
function bandFor(radius: number): SpriteBand {
  if (radius < 24) return "small";
  if (radius < 48) return "medium";
  return "large";
}

// converts reflectivity into restrained same-hue opacity instead of a misleading rainbow ramp
function opacityFor(reflectivityDbz: number): number {
  return Math.min(0.8, Math.max(0.14, 0.14 + ((reflectivityDbz - 15) / 45) * 0.66));
}

// composites animated observed or forecast radar blobs above the cached geographic base map
export const radarLayer: Layer = {
  id: "radar",
  draw: (context, state, time) => {
    if (!state.layers.radar || state.mapMode !== "radar") return;
    const sprites = getSpriteSet(state.theme);
    const source = state.frame.t <= 0 ? sprites.observed : sprites.forecast;

    for (const cell of state.frame.cells) {
      const center = state.projection.project(cell.centroid);
      const radius = Math.max(12, cellRadiusPx(cell, state.projection));
      const band = source[bandFor(radius)];
      const baseOpacity = opacityFor(cell.reflectivityDbz);

      for (let index = 0; index < 3; index += 1) {
        const seed = seedFor(cell.id, index);
        const phase = seed * Math.PI * 2;
        const breathe = 1 + Math.sin(time / 1800 + phase) * 0.04;
        const drift = Math.sin(time / 3200 + phase) * radius * 0.07;
        const angle = phase + index * 1.9;
        const diameter = radius * (1.8 - index * 0.18) * breathe;
        context.globalAlpha = baseOpacity * (0.72 - index * 0.13);
        context.drawImage(band, center[0] + Math.cos(angle) * drift - diameter, center[1] + Math.sin(angle) * drift - diameter, diameter * 2, diameter * 2);
      }
    }
    context.globalAlpha = 1;
  },
};
