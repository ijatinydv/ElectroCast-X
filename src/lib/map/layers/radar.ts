import { cellRadiusPx } from "../project";
import { getStormSprites } from "../sprites";
import type { Layer } from "../engine";

// renders observed and forecast reflectivity as a few stable, feathered sprite overlaps
export const radarLayer: Layer = {
  id: "radar",
  draw: (ctx, state, time) => {
    if (state.mapMode !== "radar" || !state.layers.radar) return;
    const sprites = state.timeMin <= 0 ? getStormSprites().observed : getStormSprites().forecast;
    const breathe = 1 + Math.sin(time / 1200) * 0.04;

    for (const cell of state.frame.cells) {
      const [x, y] = state.projection.project(cell.centroid);
      const radius = Math.max(18, cellRadiusPx(cell, state.projection) * breathe);
      const reflectivity = Math.max(0, Math.min(1, (cell.reflectivityDbz - 30) / 30));
      const sprite = sprites[Math.min(sprites.length - 1, Math.floor(reflectivity * sprites.length))]!;
      const offsets = seededOffsets(cell.id, radius);
      ctx.globalAlpha = 0.5 + reflectivity * 0.5;
      for (const [offsetX, offsetY, scale] of offsets) {
        const size = radius * 2 * scale;
        ctx.drawImage(sprite, x + offsetX - size / 2, y + offsetY - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
  },
};

// derives repeatable lobe placement from the prepared cell id without mutable random state
function seededOffsets(id: string, radius: number): readonly (readonly [number, number, number])[] {
  let seed = 0;
  for (const character of id) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  return [0, 1, 2].map((index) => {
    const angle = (((seed >>> (index * 7)) & 255) / 255) * Math.PI * 2;
    const distance = index === 0 ? 0 : radius * (0.15 + (((seed >>> (index * 4 + 3)) & 31) / 160));
    return [Math.cos(angle) * distance, Math.sin(angle) * distance, index === 0 ? 1.25 : 0.92] as const;
  });
}
