import { createLightningFlashScheduler } from "@/lib/map/layers/lightning";
import type { Flash } from "@/types/scenario";
import { beforeEach, describe, expect, it } from "vitest";

// creates terse flash points whose timestamps make crossing behavior explicit in each test
function flash(tMin: number, longitude = 86.2): Flash {
  return { lonLat: [longitude, 21.1], tMin };
}

// advances a scheduler with the stable values omitted by individual scheduling assertions
function advance(timeMin: number, flashes: readonly Flash[], now = 0, outcomeMode = false) {
  return scheduler.advance({ scenarioId: "A", timeMin, flashes, now, outcomeMode });
}

// keeps each test isolated while exercising the same public scheduler used by the canvas layer
let scheduler = createLightningFlashScheduler();

beforeEach(() => {
  scheduler = createLightningFlashScheduler();
});

describe("lightning flash scheduler", () => {
  it("spawns flashes when playback crosses their prepared minute", () => {
    const flashes = [flash(-10), flash(10)];

    advance(-20, flashes);
    expect(advance(-10, flashes)).toHaveLength(1);
    expect(advance(10, flashes)).toHaveLength(2);
  });

  it("does not replay flashes after backward scrubbing and a second forward crossing", () => {
    const flashes = [flash(10)];

    advance(0, flashes);
    expect(advance(10, flashes)).toHaveLength(1);
    advance(0, flashes, 100);
    expect(advance(10, flashes, 200)).toHaveLength(1);
  });

  it("keeps predicted points hollow until outcome mode resolves them as observed", () => {
    const flashes = [flash(25)];

    advance(20, flashes);
    expect(advance(25, flashes)[0]).toMatchObject({ predicted: true });

    scheduler = createLightningFlashScheduler();
    advance(20, flashes, 0, true);
    expect(advance(25, flashes, 0, true)[0]).toMatchObject({ predicted: false });
  });

  it("merges burst overflow so no more than three bright pops are visible", () => {
    const flashes = [flash(0, 86.1), flash(0, 86.2), flash(0, 86.3), flash(0, 86.4), flash(0, 86.5)];

    const active = advance(0, flashes);
    expect(active).toHaveLength(3);
    expect(active.reduce((total, item) => total + item.brightness, 0)).toBe(5);
  });
});
