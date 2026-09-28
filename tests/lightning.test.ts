import { describe, expect, it } from "vitest";
import { FlashSpawner } from "@/lib/map/layers/lightning";
import type { Flash } from "@/types/scenario";

const observed = (tMin: number, longitude = 86.1): Flash => ({ lonLat: [longitude, 21.6], tMin });

describe("FlashSpawner", () => {
  it("spawns only observed flashes crossed while time moves forward", () => {
    const spawner = new FlashSpawner();
    spawner.advance(-20, [], 0); spawner.advance(-8, [observed(-10)], 100);
    expect(spawner.activeFlashes()).toHaveLength(1);
  });

  it("does not duplicate flashes after a backwards scrub", () => {
    const flash = observed(-10); const spawner = new FlashSpawner();
    spawner.advance(-20, [], 0); spawner.advance(-8, [flash], 100); spawner.advance(-16, [], 150); spawner.advance(-8, [flash], 200);
    expect(spawner.activeFlashes()).toHaveLength(1);
  });

  it("does not spawn future forecast flashes as observed pops", () => {
    const spawner = new FlashSpawner();
    spawner.advance(0, [], 0); spawner.advance(20, [observed(15), observed(18, 86.2)], 100);
    expect(spawner.activeFlashes()).toHaveLength(0);
  });

  it("merges bursts beyond three visible pops in one second", () => {
    const flashes = [observed(-4, 86.1), observed(-3, 86.2), observed(-2, 86.3), observed(-1, 86.4)];
    const spawner = new FlashSpawner();
    spawner.advance(-5, [], 0); spawner.advance(0, flashes, 100);
    expect(spawner.activeFlashes()).toHaveLength(3);
    expect(spawner.activeFlashes().at(-1)?.intensity).toBe(2);
  });
});
