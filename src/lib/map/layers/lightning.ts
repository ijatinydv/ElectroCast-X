import type { Flash } from "@/types/scenario";
import type { Layer, MapFrameState } from "../engine";

const maxActiveFlashes = 200;
const fullOpacityMs = 60;
const decayMs = 400;
const reducedMotionMs = 1_000;
const throttleWindowMs = 1_000;
const maxPopsPerWindow = 3;

export interface ActiveFlash { flash: Flash; startedAt: number; intensity: number; }

// Owns the bounded, imperative lifetime of observed flashes independently from React state.
export class FlashSpawner {
  private active: ActiveFlash[] = [];
  private spawned = new Set<string>();
  private popTimes: number[] = [];
  private previousTime: number | null = null;

  // Adds only newly crossed observed flashes; backwards scrubs never replay an already seen flash.
  advance(timeMin: number, flashes: readonly Flash[], now: number, reducedMotion = false): void {
    const previousTime = this.previousTime;
    this.previousTime = timeMin;
    const lifetime = reducedMotion ? reducedMotionMs : decayMs;
    this.active = this.active.filter((active) => now - active.startedAt < lifetime);
    this.popTimes = this.popTimes.filter((startedAt) => now - startedAt < throttleWindowMs);
    if (previousTime === null || timeMin <= previousTime) return;
    flashes.filter((flash) => flash.tMin <= 0 && flash.tMin > previousTime && flash.tMin <= timeMin).forEach((flash) => this.spawn(flash, now));
  }

  activeFlashes(): readonly ActiveFlash[] { return this.active; }

  // Reports whether a decay or reduced-motion marker still needs another RAF frame.
  isAnimating(now: number, reducedMotion: boolean): boolean {
    const lifetime = reducedMotion ? reducedMotionMs : decayMs;
    return this.active.some((active) => now - active.startedAt < lifetime);
  }

  // Resets temporal identity when a completely different prepared scenario is selected.
  reset(timeMin: number): void {
    this.active = [];
    this.spawned.clear();
    this.popTimes = [];
    this.previousTime = timeMin;
  }

  private spawn(flash: Flash, now: number): void {
    const key = flashKey(flash);
    if (this.spawned.has(key)) return;
    this.spawned.add(key);
    if (this.popTimes.length >= maxPopsPerWindow) {
      const newest = this.active.at(-1);
      if (newest) { newest.intensity += 1; return; }
    }
    this.popTimes.push(now);
    this.active.push({ flash, startedAt: now, intensity: 1 });
    if (this.active.length > maxActiveFlashes) this.active.splice(0, this.active.length - maxActiveFlashes);
  }
}

// Keeps independent flashes at one minute distinct while repeated prepared frame samples dedupe.
function flashKey(flash: Flash): string {
  return `${flash.tMin}:${flash.lonLat[0].toFixed(3)}:${flash.lonLat[1].toFixed(3)}`;
}

const spawner = new FlashSpawner();
let scenarioId: string | null = null;

// Renders observed lightning as a bolt-less cyan bloom and future flashes as forecast rings.
export const lightningLayer: Layer = {
  id: "lightning",
  draw: (ctx, state, now) => {
    if (!state.layers.lightning) return;
    if (scenarioId !== state.scenario.id) { scenarioId = state.scenario.id; spawner.reset(state.timeMin); }
    spawner.advance(state.timeMin, state.frame.lightning, now, state.reducedMotion);
    drawPredictedFlashes(ctx, state, now);
    spawner.activeFlashes().forEach((active) => drawObservedFlash(ctx, state, active, now));
  },
};

// Lets the engine stop its RAF as soon as every observed flash has finished fading.
export function lightningIsAnimating(now: number, reducedMotion: boolean): boolean {
  return spawner.isAnimating(now, reducedMotion);
}

function drawPredictedFlashes(ctx: CanvasRenderingContext2D, state: MapFrameState, now: number): void {
  const pulse = state.reducedMotion ? 1 : 1 + Math.sin(now / 700) * 0.08;
  ctx.save();
  ctx.strokeStyle = state.theme.forecast;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.82;
  state.frame.lightning.filter((flash) => flash.tMin > 0).forEach((flash) => {
    const [x, y] = state.projection.project(flash.lonLat);
    ctx.beginPath(); ctx.arc(x, y, 6 * pulse, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.restore();
}

function drawObservedFlash(ctx: CanvasRenderingContext2D, state: MapFrameState, active: ActiveFlash, now: number): void {
  const elapsed = now - active.startedAt;
  const lifetime = state.reducedMotion ? reducedMotionMs : decayMs;
  if (elapsed >= lifetime) return;
  const [x, y] = state.projection.project(active.flash.lonLat);
  if (state.reducedMotion) {
    ctx.save(); ctx.fillStyle = state.theme.observed; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    return;
  }
  const opacity = elapsed <= fullOpacityMs ? 1 : 1 - (elapsed - fullOpacityMs) / (decayMs - fullOpacityMs);
  const radius = 14 + Math.min(active.intensity, 4) * 3;
  const bloom = ctx.createRadialGradient(x, y, 0, x, y, radius);
  bloom.addColorStop(0, state.theme.foreground);
  bloom.addColorStop(0.2, state.theme.observed);
  bloom.addColorStop(1, "transparent");
  ctx.save();
  ctx.globalAlpha = Math.max(0, opacity) * Math.min(active.intensity, 3);
  ctx.fillStyle = bloom; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = state.theme.foreground; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
