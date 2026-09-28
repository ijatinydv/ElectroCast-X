import { describe, expect, it } from "vitest";
import scenario from "@/data/scenarios/a-first-flash.json";
import { nearestCellId } from "@/lib/map/engine";
import { MapProjection } from "@/lib/map/project";
import type { Scenario } from "@/types/scenario";

const preparedScenario = scenario as unknown as Scenario;

describe("map screen-space hit testing", () => {
  it("returns a cell within its rendered radius and no cell far outside it", () => {
    const projection = new MapProjection(preparedScenario.region, 800, 600);
    const cell = preparedScenario.frames[0]!.cells[0]!;
    const [x, y] = projection.project(cell.centroid);
    expect(nearestCellId([cell], projection, [x, y])).toBe(cell.id);
    expect(nearestCellId([cell], projection, [x + 500, y + 500])).toBeNull();
  });
});

describe("map projection refits", () => {
  it("interpolates the selected scenario region over the requested 400 ms", () => {
    const projection = new MapProjection(preparedScenario.region, 800, 600);
    const point = preparedScenario.frames[0]!.cells[0]!.centroid;
    const before = projection.project(point);

    projection.refit(preparedScenario.region, 1000, 600, 1_000);
    projection.update(1_200);
    const halfway = projection.project(point);
    projection.update(1_400);
    const complete = projection.project(point);

    expect(halfway).not.toEqual(before);
    expect(halfway).not.toEqual(complete);
  });
});
