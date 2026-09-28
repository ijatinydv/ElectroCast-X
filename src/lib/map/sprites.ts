// caches small radial sprites so the animated radar pass only performs drawImage calls
export interface StormSprites {
  observed: readonly HTMLCanvasElement[];
  forecast: readonly HTMLCanvasElement[];
}

const bands = [0.38, 0.58, 0.82] as const;
let cachedSprites: StormSprites | null = null;

// creates the bounded set of soft cell sprites required by the map's intensity bands
export function getStormSprites(): StormSprites {
  if (cachedSprites) return cachedSprites;
  cachedSprites = {
    observed: bands.map((opacity) => createSprite("#42d9e8", opacity)),
    forecast: bands.map((opacity) => createSprite("#a78bfa", opacity)),
  };
  return cachedSprites;
}

// bakes a feathered radial field once instead of creating gradients inside the RAF loop
function createSprite(color: string, opacity: number): HTMLCanvasElement {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Sprite canvas 2D context is unavailable");
  const gradient = context.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, rgba(color, opacity));
  gradient.addColorStop(0.42, rgba(color, opacity * 0.54));
  gradient.addColorStop(1, rgba(color, 0));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return canvas;
}

// turns the token-compatible hex palette into a canvas rgba value for pre-rendered artwork
function rgba(hex: string, alpha: number): string {
  const value = hex.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
