import type { Scenario } from "@/types/scenario";
import { maskBits, type SensorMask } from "./mask";

// retrieves the precomputed and monotonic 30-minute risk for one sensor configuration
export function riskFor(scenario: Scenario, cellId: string, mask: Partial<SensorMask>): number {
  const risk = scenario.sensorTable[cellId]?.[maskBits(mask).toString()];
  if (risk === undefined) throw new Error(`Missing sensor risk for cell ${cellId}`);
  return risk;
}
