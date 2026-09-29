import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import A from "@/data/scenarios/a-first-flash.json";
import B from "@/data/scenarios/b-severe-storm.json";
import C from "@/data/scenarios/c-sensor-loss.json";
import { SensorHealth } from "@/components/panels/SensorHealth";
import { maskBits, riskFor, type SensorMask } from "@/lib/derive";
import type { Scenario } from "@/types/scenario";

const sensorLoss = C as unknown as Scenario;
const scenarios = [A as unknown as Scenario, B as unknown as Scenario];
const sensorIds = ["radar", "insat", "lightning", "nwp"] as const;

// builds a complete disabled-source mask from the sensor-table bit representation
function maskFor(bits: number): SensorMask {
  return Object.fromEntries(sensorIds.map((sensor, index) => [sensor, Boolean(bits & (1 << index))])) as SensorMask;
}

// renders Scenario C's T0 health state to protect scripted feed outage presentation
function sensorLossHealthMarkup(): string {
  const frame = sensorLoss.frames.find((candidate) => candidate.t === 0);
  if (!frame) throw new Error("Scenario C requires a T0 frame");
  return renderToStaticMarkup(createElement(SensorHealth, { frame, sensorOff: { radar: false, insat: false, lightning: false, nwp: false } }));
}

describe("SensorHealth", () => {
  it("shows Scenario C radar offline and lightning delayed with its data age", () => {
    const markup = sensorLossHealthMarkup();
    expect(markup).toContain("Radar");
    expect(markup).toContain("Offline");
    expect(markup).toContain("Lightning network");
    expect(markup).toContain("Delayed");
    expect(markup).toContain("11 min");
  });
});

describe("sensor table coverage", () => {
  it("returns every prepared Scenario A and B value for all sixteen sensor masks", () => {
    for (const scenario of scenarios) {
      for (const [cellId, table] of Object.entries(scenario.sensorTable)) {
        for (let bits = 0; bits < 16; bits += 1) {
          const mask = maskFor(bits);
          expect(maskBits(mask)).toBe(bits);
          expect(riskFor(scenario, cellId, mask)).toBe(table[String(bits)]);
        }
      }
    }
  });
});
