import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import A from "@/data/scenarios/a-first-flash.json";
import B from "@/data/scenarios/b-severe-storm.json";
import { EvidencePanel } from "@/components/panels/EvidencePanel";
import { evidenceDeltaAt, evidenceMarkerIndex } from "@/lib/derive";
import type { Scenario } from "@/types/scenario";

const firstFlash = A as unknown as Scenario;
const severeStorm = B as unknown as Scenario;
const enabledSensors = { radar: false, insat: false, lightning: false, nwp: false };

// renders a selected cell evidence panel against its prepared scenario state
function evidenceMarkup(scenario: Scenario, cellId: string, timeMin: number, sensorOff = enabledSensors): string {
  const cell = scenario.frames.find((frame) => frame.t === timeMin)?.cells.find((candidate) => candidate.id === cellId);
  if (!cell) throw new Error(`Scenario requires ${cellId} at ${timeMin}`);
  return renderToStaticMarkup(createElement(EvidencePanel, { scenario, cell, timeMin, sensorOff }));
}

describe("EvidencePanel", () => {
  it("renders approved physical variables with directional icons, deltas, and current markers", () => {
    const markup = evidenceMarkup(severeStorm, "C-B03", 0);
    expect(markup).toContain("Echo top");
    expect(markup).toContain("+1.1 km");
    expect(markup).toContain('aria-label="up"');
    expect(markup).toContain("Why did risk increase?");
    expect(markup).toContain("km wide");
  });

  it("moves the marker and recalculates numeric deltas from prepared trend values", () => {
    const evidence = firstFlash.frames[0]!.cells[0]!.evidence[0]!;
    const start = evidenceMarkerIndex(-60, evidence.sparkline.length);
    const end = evidenceMarkerIndex(60, evidence.sparkline.length);
    expect(start).toBe(0);
    expect(end).toBe(evidence.sparkline.length - 1);
    expect(evidenceDeltaAt(evidence, start)).toBe("+0.0 km");
    expect(evidenceDeltaAt(evidence, end)).toBe("+0.8 km");
  });

  it("keeps radar evidence legible and explicitly unavailable when radar is off", () => {
    const markup = evidenceMarkup(firstFlash, "C-A07", 0, { ...enabledSensors, radar: true });
    expect(markup).toContain("Radar unavailable");
    expect(markup).toContain("ZDR column");
    expect(markup).toContain("Mixed-phase growth");
  });
});
