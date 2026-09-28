import type { MapTheme } from "./theme";

// names the compact soft-blob sizes shared by radar and satellite field rendering
export type SpriteBand = "small" | "medium" | "large";

// keeps pre-rendered same-hue radial sprites available for inexpensive map compositing
export interface SpriteSet {
  observed: Record<SpriteBand, HTMLCanvasElement>;
  forecast: Record<SpriteBand, HTMLCanvasElement>;
  cloudTop: Record<SpriteBand, HTMLCanvasElement>;
}

let spriteSet: SpriteSet | null = null;

// builds a radial sprite once so animated radar cells never create gradients during a frame
function createRadialSprite(color: string, diameter: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = diameter;
  canvas.height = diameter;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");

  const radius = diameter / 2;
  const gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.45, color);
  gradient.addColorStop(1, "transparent");
  context.fillStyle = gradient;
  context.fillRect(0, 0, diameter, diameter);
  return canvas;
}

// creates intensity bands from the shared semantic colours for use by map-only canvases
export function getSpriteSet(theme: Pick<MapTheme, "observed" | "forecast">): SpriteSet {
  if (spriteSet) return spriteSet;
  const diameters: Record<SpriteBand, number> = { small: 64, medium: 96, large: 128 };
  // produces every size for a single semantic field colour without creating sprites during rendering
  const build = (color: string): Record<SpriteBand, HTMLCanvasElement> => ({
    small: createRadialSprite(color, diameters.small),
    medium: createRadialSprite(color, diameters.medium),
    large: createRadialSprite(color, diameters.large),
  });

  spriteSet = { observed: build(theme.observed), forecast: build(theme.forecast), cloudTop: build(theme.observed) };
  return spriteSet;
}
