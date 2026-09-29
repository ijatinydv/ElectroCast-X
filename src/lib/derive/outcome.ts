import { frameAt } from "@/lib/map/interpolate";
import type { Cell, Scenario } from "@/types/scenario";

// describes the prepared retrospective statement shown while compare mode is active
export interface OutcomeSummary {
  firstFlashMin: number;
  windowMin: readonly [number, number];
  insidePrediction: boolean;
}

// determines whether a prepared outcome point falls within a forecast region
function pointInPolygon([x, y]: readonly [number, number], polygon: readonly [number, number][]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index]!;
    const [xj, yj] = polygon[previous]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// finds the first-flash cell that owns the prepared forecast window
function firstFlashCell(cells: readonly Cell[]): Cell | undefined {
  return cells.find((cell) => cell.mode === "first-flash" && cell.firstFlash);
}

// relates the recorded first flash to its issued forecast window and contemporaneous region
export function outcomeSummaryFor(scenario: Scenario): OutcomeSummary | null {
  const firstFlashMin = scenario.outcome.firstFlashMin;
  const firstFlash = scenario.outcome.observedFlashes.find((flash) => flash.tMin === firstFlashMin);
  const issuedCell = firstFlashCell(frameAt(scenario, 0).cells);
  const outcomeCell = firstFlash === undefined ? undefined : firstFlashCell(frameAt(scenario, firstFlash.tMin).cells);
  if (firstFlashMin === undefined || firstFlash === undefined || !issuedCell?.firstFlash || !outcomeCell?.firstFlash) return null;

  return {
    firstFlashMin,
    windowMin: issuedCell.firstFlash.windowMin,
    insidePrediction: pointInPolygon(firstFlash.lonLat, outcomeCell.firstFlash.region),
  };
}
