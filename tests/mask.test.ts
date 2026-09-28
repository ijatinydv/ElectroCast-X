import { describe, expect, it } from "vitest";
import { enabledSensors, widthScale } from "@/lib/derive/mask";
import type { Frame } from "@/types/scenario";

const healthy: Frame["sensorHealth"] = {
  radar: { status: "online", dataAgeMin: 4 },
  insat: { status: "online", dataAgeMin: 7 },
  lightning: { status: "online", dataAgeMin: 3 },
  nwp: { status: "online", dataAgeMin: 0 },
};

describe("widthScale", () => {
  it("applies the documented sensor-loss weights", () => {
    expect(widthScale({ ...enabledSensors(), radar: true, lightning: true }, healthy)).toBeCloseTo(1.55);
  });

  it("adds capped staleness only from enabled sensors", () => {
    const stale = { ...healthy, radar: { status: "delayed" as const, dataAgeMin: 25 } };
    expect(widthScale(enabledSensors(), stale)).toBeCloseTo(1.25);
    expect(widthScale({ ...enabledSensors(), radar: true }, stale)).toBeCloseTo(1.35);
  });
});
