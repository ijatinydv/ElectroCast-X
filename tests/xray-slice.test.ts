import { describe, expect, it } from "vitest";
import { sliceReadoutFor } from "@/lib/derive/volume";
import type { Cell } from "@/types/scenario";

// supplies only the prepared cell fields used by the X-ray slice derivation
const cell = {
  id: "C-A07",
  echoTopKm: 14,
  reflectivityDbz: 52,
  updraftMs: 18,
  freezingLevelKm: 4.8,
  zdrColumnLevel: "-10C",
  kdpCore: 3.1,
} satisfies Pick<Cell, "id" | "echoTopKm" | "reflectivityDbz" | "updraftMs" | "freezingLevelKm" | "zdrColumnLevel" | "kdpCore">;

describe("sliceReadoutFor", () => {
  it("samples stable reflectivity from the procedural volume", () => {
    expect(sliceReadoutFor(cell, 5)).toEqual(sliceReadoutFor(cell, 5));
    expect(sliceReadoutFor(cell, 5).reflectivityDbz).toBeGreaterThan(0);
  });

  it("centres the KDP profile on the cell-derived mixed-phase altitude", () => {
    const mixedPhaseAltitude = cell.freezingLevelKm + 10 / 6.5;
    expect(sliceReadoutFor(cell, mixedPhaseAltitude).kdpDegKm).toBeGreaterThan(sliceReadoutFor(cell, 0).kdpDegKm);
  });
});
