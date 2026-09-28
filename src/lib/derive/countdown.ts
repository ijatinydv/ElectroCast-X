import type { Cell, Scenario } from "@/types/scenario";
import { type SensorMask } from "./mask";
import { riskFor } from "./risk";

// packages display-ready forecast horizons with optional first-flash context
export type Countdown = { p15: number; p30: number; p60: number; windowMin?: [number, number]; confidence?: "Low" | "Moderate" | "High" };

// rescales source horizons around the authoritative masked 30-minute probability
function scaledCountdown(cell: Cell, p30: number): Countdown {
  const source = cell.firstFlash;
  if (!source) return { p15: p30, p30, p60: p30 };
  const sourceP30 = source.p30 * 100;
  const ratio = sourceP30 === 0 ? 1 : p30 / sourceP30;
  return {
    p15: Math.min(p30, Math.max(0, source.p15 * 100 * ratio)),
    p30,
    p60: Math.max(p30, Math.min(100, source.p60 * 100 * ratio)),
    windowMin: source.windowMin,
    confidence: source.confidence,
  };
}

// exposes both direct and scenario-backed countdown lookups without duplicating risk logic
export function countdownFor(cell: Cell, p30: number): Countdown;
export function countdownFor(scenario: Scenario, cellId: string, mask: Partial<SensorMask>): Countdown;
export function countdownFor(cellOrScenario: Cell | Scenario, p30OrCellId: number | string, mask?: Partial<SensorMask>): Countdown {
  if ("frames" in cellOrScenario) {
    const cellId = p30OrCellId as string;
    const cell = cellOrScenario.frames.find((frame) => frame.t === 0)?.cells.find((candidate) => candidate.id === cellId);
    if (!cell) throw new Error(`Missing T0 cell ${cellId}`);
    return scaledCountdown(cell, riskFor(cellOrScenario, cellId, mask ?? {}));
  }
  return scaledCountdown(cellOrScenario, p30OrCellId as number);
}
