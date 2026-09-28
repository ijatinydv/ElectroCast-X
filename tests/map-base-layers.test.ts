import { describe, expect, it } from "vitest";
import { boxesOverlap, placeDistrictLabels } from "@/lib/map/layers/base";

describe("base map labels", () => {
  it("uses strict AABB overlap checks for label collision avoidance", () => {
    expect(boxesOverlap({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 9, top: 9, right: 19, bottom: 19 })).toBe(true);
    expect(boxesOverlap({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 10, top: 0, right: 20, bottom: 10 })).toBe(false);
  });

  it("keeps the largest colliding district label", () => {
    const labels = placeDistrictLabels(
      [
        { name: "Small", center: [1, 1] as [number, number], area: 1 },
        { name: "Large", center: [1, 1] as [number, number], area: 2 },
      ],
      () => [20, 20],
      () => 24,
    );

    expect(labels.map((label) => label.name)).toEqual(["Large"]);
  });
});
