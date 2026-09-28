import type { Flash } from "@/types/scenario";
import type { Layer } from "../engine";

// bounds retained flash state so prolonged playback has a fixed memory cost
const maximumFlashes = 200;

// keeps full-intensity flash illumination within the specified brief visible pop
const fullBloomDurationMs = 60;

// defines the required soft-bloom fade after a flash reaches peak intensity
const bloomDecayDurationMs = 400;

// makes reduced-motion flash markers perceptible without animated illumination
const reducedMotionDurationMs = 1000;

// applies the photosensitivity limit to all bright observed flash pops together
const maximumPopsPerSecond = 3;

// represents a canvas flash after it has been accepted by the scheduler
export interface ActiveLightningFlash {
  flash: Flash;
  startedAt: number;
  brightness: number;
  predicted: boolean;
}

// describes the non-DOM inputs needed to advance lightning events across playback time
export interface LightningAdvanceInput {
  scenarioId: string;
  timeMin: number;
  flashes: readonly Flash[];
  now: number;
  outcomeMode: boolean;
}

// gives tests and canvas consumers a stable way to inspect scheduled flash state
export interface LightningFlashScheduler {
  advance: (input: LightningAdvanceInput) => readonly ActiveLightningFlash[];
  active: () => readonly ActiveLightningFlash[];
}

// gives identical prepared flashes one stable identity across interpolated frames
function flashKey(flash: Flash): string {
  return `${flash.tMin}:${flash.lonLat[0]}:${flash.lonLat[1]}:${flash.altKm ?? ""}`;
}

// creates a capped scheduler that remains idempotent when users scrub playback backwards
export function createLightningFlashScheduler(): LightningFlashScheduler {
  let scenarioId: string | null = null;
  let previousTimeMin: number | null = null;
  let activeFlashes: ActiveLightningFlash[] = [];
  let spawnedKeys = new Set<string>();
  let recentPopTimes: number[] = [];

  // discards expired visual state before the next simulation crossing is handled
  const removeExpired = (now: number) => {
    activeFlashes = activeFlashes.filter((active) => now - active.startedAt < (active.predicted ? reducedMotionDurationMs : bloomDecayDurationMs + fullBloomDurationMs));
    recentPopTimes = recentPopTimes.filter((popTime) => now - popTime < 1000);
  };

  // adds one event while folding throttle overflow into the nearest recent bright pop
  const schedule = (flash: Flash, now: number, outcomeMode: boolean) => {
    const predicted = flash.tMin > 0 && !outcomeMode;
    if (!predicted && recentPopTimes.length >= maximumPopsPerSecond) {
      const mergeTarget = activeFlashes
        .filter((active) => !active.predicted && now - active.startedAt < 1000)
        .sort((first, second) => distanceSquared(first.flash, flash) - distanceSquared(second.flash, flash))[0];
      if (mergeTarget) {
        mergeTarget.brightness += 1;
        return;
      }
    }

    activeFlashes.push({ flash, startedAt: now, brightness: 1, predicted });
    if (!predicted) recentPopTimes.push(now);
    if (activeFlashes.length > maximumFlashes) activeFlashes.splice(0, activeFlashes.length - maximumFlashes);
  };

  // advances only forward crossings so repeated frames and backward scrubs cannot replay flashes
  const advance = ({ scenarioId: nextScenarioId, timeMin, flashes, now, outcomeMode }: LightningAdvanceInput) => {
    if (scenarioId !== nextScenarioId) {
      scenarioId = nextScenarioId;
      previousTimeMin = null;
      activeFlashes = [];
      spawnedKeys = new Set<string>();
      recentPopTimes = [];
    }

    removeExpired(now);
    const crossingStart = previousTimeMin ?? timeMin - Number.EPSILON;
    if (timeMin >= crossingStart) {
      for (const flash of flashes) {
        const key = flashKey(flash);
        if (flash.tMin >= crossingStart && flash.tMin <= timeMin && !spawnedKeys.has(key)) {
          spawnedKeys.add(key);
          schedule(flash, now, outcomeMode);
        }
      }
    }
    previousTimeMin = timeMin;
    return activeFlashes;
  };

  // exposes current scheduled items without permitting callers to replace the buffer
  const active = () => activeFlashes;

  return { advance, active };
}

// compares geographic separation only when coalescing a burst that exceeded the screen limit
function distanceSquared(first: Flash, second: Flash): number {
  const longitude = first.lonLat[0] - second.lonLat[0];
  const latitude = first.lonLat[1] - second.lonLat[1];
  return longitude * longitude + latitude * latitude;
}

// renders flashes with an opaque centre and bloom rather than unsafe jagged bolt artwork
function drawFlash(context: CanvasRenderingContext2D, active: ActiveLightningFlash, state: Parameters<Layer["draw"]>[1], now: number, reducedMotion: boolean): void {
  const point = state.projection.project(active.flash.lonLat);
  const elapsed = now - active.startedAt;
  const duration = active.predicted || reducedMotion ? reducedMotionDurationMs : fullBloomDurationMs + bloomDecayDurationMs;
  if (elapsed >= duration) return;

  if (active.predicted) {
    context.save();
    context.globalAlpha = 1 - elapsed / reducedMotionDurationMs;
    context.strokeStyle = state.theme.forecast;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(point[0], point[1], 7, 0, Math.PI * 2);
    context.stroke();
    context.restore();
    return;
  }

  if (reducedMotion) {
    context.save();
    context.globalAlpha = 1 - elapsed / reducedMotionDurationMs;
    context.fillStyle = state.theme.observed;
    context.beginPath();
    context.arc(point[0], point[1], 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  const fade = elapsed <= fullBloomDurationMs ? 1 : 1 - (elapsed - fullBloomDurationMs) / bloomDecayDurationMs;
  const radius = 18 + active.brightness * 5;
  const bloom = context.createRadialGradient(point[0], point[1], 0, point[0], point[1], radius);
  bloom.addColorStop(0, "rgba(232, 252, 255, 1)");
  bloom.addColorStop(0.15, "rgba(232, 252, 255, 0.96)");
  bloom.addColorStop(0.45, "rgba(88, 221, 255, 0.34)");
  bloom.addColorStop(1, "rgba(88, 221, 255, 0)");
  context.save();
  context.globalAlpha = fade;
  context.fillStyle = bloom;
  context.beginPath();
  context.arc(point[0], point[1], radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#e8fcff";
  context.beginPath();
  context.arc(point[0], point[1], 2 + Math.min(active.brightness - 1, 3) * 0.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

// owns the map-local scheduler so the imperative canvas can animate independently from React
const scheduler = createLightningFlashScheduler();

// paints observed pops and forecast rings from prepared flash points in the active scenario frame
export const lightningLayer: Layer = {
  id: "lightning",
  draw: (context, state, now) => {
    if (!state.layers.lightning) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flashes = state.compareOn ? state.scenario.outcome.observedFlashes : state.frame.lightning;
    const activeFlashes = scheduler.advance({
      scenarioId: state.scenario.id,
      timeMin: state.timeMin,
      flashes,
      now,
      outcomeMode: state.compareOn,
    });
    for (const active of activeFlashes) drawFlash(context, active, state, now, reducedMotion);
  },
};
