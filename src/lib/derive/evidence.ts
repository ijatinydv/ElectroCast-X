import type { Cell, Evidence, Scenario, SensorId } from "@/types/scenario";
import { enabledSensors, type SensorMask } from "./mask";
import { riskFor } from "./risk";

const sensorVariables: Record<SensorId, readonly string[]> = {
  radar: ["mixedPhaseGrowth", "zdrColumnLevel", "kdpCore", "echoTop"],
  insat: ["cloudTopCooling"],
  lightning: ["flashRate"],
  nwp: ["cape", "freezingLevel"],
};

// maps every approved physical evidence variable to the feed needed to observe it
export function sensorForEvidence(variable: Evidence["variable"]): SensorId | undefined {
  return (Object.keys(sensorVariables) as SensorId[]).find((sensor) => sensorVariables[sensor].includes(variable));
}

// places the evidence marker across its prepared trend over the shared scenario clock
export function evidenceMarkerIndex(timeMin: number, pointCount: number): number {
  if (pointCount < 2) return 0;
  const progress = Math.min(1, Math.max(0, (timeMin + 60) / 120));
  return Math.round(progress * (pointCount - 1));
}

// scales a prepared numeric trend delta to the portion visible at the current marker
export function evidenceDeltaAt(evidence: Evidence, markerIndex: number): string {
  const numericDelta = evidence.delta.match(/^([+−-])(\d+(?:\.\d+)?)(.*)$/);
  const start = evidence.sparkline[0];
  const end = evidence.sparkline.at(-1);
  const current = evidence.sparkline[markerIndex];
  if (!numericDelta || start === undefined || end === undefined || current === undefined || end === start) return evidence.delta;

  const [, sign, magnitude, unit] = numericDelta;
  const scaledMagnitude = Number(magnitude) * Math.abs((current - start) / (end - start));
  const displaySign = sign === "−" || sign === "-" ? "−" : "+";
  return `${displaySign}${scaledMagnitude.toFixed(1)}${unit}`;
}

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
