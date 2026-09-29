import { glyphFillFraction, glyphNumerals, motionTicks } from "@/lib/map/stationGlyph";
import type { Cell } from "@/types/scenario";
import { describe, expect, it } from "vitest";

// supplies only the prepared fields consumed by the station glyph formatters
function glyphCell(overrides: Partial<Pick<Cell, "echoTopKm" | "flashRate" | "headlineRisk" | "mode" | "id">> = {}): Pick<Cell, "echoTopKm" | "flashRate" | "headlineRisk" | "mode" | "id"> {
  return {
    echoTopKm: 12.4,
    flashRate: 8.6,
    headlineRisk: 63,
    mode: "first-flash",
    id: "C-A07",
    ...overrides,
  };
}

describe("storm-cell station glyph", () => {
  it("converts headline risk into the expected pie fill fraction", () => {
    expect(glyphFillFraction(glyphCell({ headlineRisk: 0 }))).toBe(0);
    expect(glyphFillFraction(glyphCell({ headlineRisk: 50 }))).toBe(0.5);
    expect(glyphFillFraction(glyphCell({ headlineRisk: 100 }))).toBe(1);
  });

  it("rounds motion speed before deriving full ticks, half ticks, and pennants", () => {
    expect(motionTicks(0)).toEqual({ full: 0, half: false, pennant: false });
    expect(motionTicks(12)).toEqual({ full: 1, half: false, pennant: false });
    expect(motionTicks(47)).toEqual({ full: 4, half: true, pennant: false });
    expect(motionTicks(60)).toEqual({ full: 1, half: false, pennant: true });
    expect(motionTicks(83)).toEqual({ full: 3, half: true, pennant: true });
  });

  it("shows flash rate for active cells and headline risk before first flash", () => {
    expect(glyphNumerals(glyphCell({ mode: "active", flashRate: 8.6 })).lowerLeft).toBe("8.6/min");
    expect(glyphNumerals(glyphCell({ mode: "first-flash", headlineRisk: 63 })).lowerLeft).toBe("63%");
  });
});
