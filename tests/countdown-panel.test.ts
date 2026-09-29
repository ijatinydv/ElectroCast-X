import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import B from "@/data/scenarios/b-severe-storm.json";
import { CountdownPanel } from "@/components/panels/CountdownPanel";
import type { Scenario } from "@/types/scenario";

const severeStorm = B as unknown as Scenario;

// renders the active-storm panel against the prepared Scenario B electrified cell
function activeStormMarkup(): string {
  const cell = severeStorm.frames.find((frame) => frame.t === 0)?.cells.find((candidate) => candidate.id === "C-B03");
  if (!cell) throw new Error("Scenario B requires C-B03 at t=0");
  return renderToStaticMarkup(createElement(CountdownPanel, {
    scenario: severeStorm,
    cell,
    timeMin: 0,
    sensorOff: { radar: false, insat: false, lightning: false, nwp: false },
  }));
}

describe("CountdownPanel", () => {
  it("uses active-storm fields rather than first-flash countdown fields for electrified cells", () => {
    const markup = activeStormMarkup();
    expect(markup).toContain("Flash rate");
    expect(markup).toContain("Density trend");
    expect(markup).toContain("Motion");
    expect(markup).toContain("Intensifying");
    expect(markup).not.toContain("Estimated window");
  });
});
