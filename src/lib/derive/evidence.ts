import type { Cell, Evidence, Scenario, SensorId } from "@/types/scenario";
import { enabledSensors, type SensorMask } from "./mask";
import { riskFor } from "./risk";

const sensorVariables: Record<SensorId, readonly string[]> = { radar: ["mixedPhaseGrowth", "zdrColumnLevel", "kdpCore"], insat: ["cloudTopCooling"], lightning: ["flashRate"], nwp: ["cape", "freezingLevel"] };

// identifies the most consequential single disabled source from the precomputed table
export function contributionFor(scenario: Scenario, cell: Cell): { top: SensorId; sentence: string } {
  const baseline = riskFor(scenario, cell.id, enabledSensors());
  const candidates = (Object.keys(sensorVariables) as SensorId[]).map((sensor) => ({ sensor, drop: baseline - riskFor(scenario, cell.id, { [sensor]: true }) }));
  const top = candidates.reduce((leading, candidate) => candidate.drop > leading.drop ? candidate : leading).sensor;
  const evidence = cell.evidence.find((row) => sensorVariables[top].includes(row.variable)) ?? cell.evidence[0];
  const phrase = evidence?.label.toLowerCase() ?? "storm structure";
  return { top, sentence: `${top === "insat" ? "Satellite" : top === "nwp" ? "NWP" : top[0]!.toUpperCase() + top.slice(1)} contributed most strongly because of ${phrase}.` };
}

// returns immutable evidence rows for panels without letting them reach into scenario structure
export function evidenceFor(cell: Cell): readonly Evidence[] {
  return cell.evidence;
}
