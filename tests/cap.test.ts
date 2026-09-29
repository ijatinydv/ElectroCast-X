import { describe, expect, it } from "vitest";
import { buildCap } from "@/lib/i18n/cap";
import { frameAt } from "@/lib/map/interpolate";
import type { Scenario } from "@/types/scenario";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";

// builds a CAP alert from a selected prepared scenario cell
function capFor(scenarioFixture: unknown, place: string) {
  const scenario = scenarioFixture as Scenario;
  const cell = frameAt(scenario, 0).cells[0]!;
  return buildCap(scenario, cell, 30, place, 0);
}

// verifies the CAP preview preserves its required simulated CAP 1.2 envelope
describe("buildCap", () => {
  it("builds deterministic CAP 1.2 fields for A with a closed latitude-longitude polygon", () => {
    const cap = capFor(scenarioA, "Balasore");
    const repeated = capFor(scenarioA, "Balasore");
    const info = cap.alert.info[0]!;

    expect(cap).toEqual(repeated);
    expect(cap.alert).toMatchObject({
      identifier: "ECX-DEMO-A-C-A07-20260514-1600",
      sender: "demo@electrocast-x.example",
      status: "Exercise",
      msgType: "Alert",
      scope: "Public",
      note: "Simulated exercise. Not an operational warning.",
    });
    expect(info).toMatchObject({
      language: "en-IN",
      category: "Met",
      event: "Lightning",
      responseType: "Shelter",
      urgency: "Expected",
      severity: "Severe",
      certainty: "Likely",
      area: { areaDesc: "Balasore" },
    });
    const points = info.area.polygon.split(" ");
    expect(points[0]).toBe(points.at(-1));
    expect(points[0]).toBe("21.651,86.112");
  });

  it("builds CAP required fields for B and makes active lightning immediate", () => {
    const cap = capFor(scenarioB, "Bhadrak");
    const info = cap.alert.info[0]!;

    expect(cap.alert.identifier).toBe("ECX-DEMO-B-C-B03-20260514-1600");
    expect(info.urgency).toBe("Immediate");
    expect(info.certainty).toBe("Likely");
    expect(info.effective).toBe(cap.alert.sent);
    expect(info.expires).not.toBe(info.effective);
  });
});
