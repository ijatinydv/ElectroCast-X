import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Sparkline } from "@/components/ui/Sparkline";
import { corridorWidthKm, evidenceDeltaAt, evidenceFor, evidenceMarkerIndex, effectiveSensorMask, sensorForEvidence, widthScale } from "@/lib/derive";
import { frameAt } from "@/lib/map/interpolate";
import type { SensorMask } from "@/lib/derive";
import type { Cell, Evidence, Scenario } from "@/types/scenario";

interface EvidencePanelProps {
  scenario: Scenario;
  cell: Cell;
  timeMin: number;
  sensorOff: SensorMask;
}

// selects a directional icon without turning a physical observation into generic copy
function DirectionIcon({ direction }: Pick<Evidence, "direction">) {
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : ArrowRight;
  return <Icon aria-label={direction} className="size-3.5 shrink-0" strokeWidth={1.75} />;
}

// names an unavailable feed precisely so a disabled observation remains operationally clear
function unavailableSensorLabel(variable: Evidence["variable"]): string {
  const sensor = sensorForEvidence(variable);
  const labels = { radar: "Radar", insat: "INSAT", lightning: "Lightning network", nwp: "NWP" } as const;
  return sensor ? `${labels[sensor]} unavailable` : "Observation unavailable";
}

// renders one evidence trend while preserving a legible unavailable-feed state
function EvidenceRow({ evidence, timeMin, unavailable }: { evidence: Evidence; timeMin: number; unavailable: boolean }) {
  const markerIndex = evidenceMarkerIndex(timeMin, evidence.sparkline.length);
  const delta = evidenceDeltaAt(evidence, markerIndex);
  const trendColor = unavailable ? "var(--color-fg-3)" : "var(--color-observed)";

  return (
    <li className={unavailable ? "text-fg-3" : "text-fg"}>
      <div className="flex items-center gap-2">
        <DirectionIcon direction={evidence.direction} />
        <span className="min-w-0 flex-1 text-sm">{evidence.label}</span>
        {unavailable ? <span className="text-xs text-fg-3">{unavailableSensorLabel(evidence.variable)}</span> : <span className="num text-xs text-fg-2">{delta}</span>}
      </div>
      <div className="ml-5 mt-1 flex justify-end">
        <Sparkline aria-label={`${evidence.label} trend`} values={evidence.sparkline} markerIndex={markerIndex} color={trendColor} width={116} height={26} />
      </div>
    </li>
  );
}

// combines confidence, uncertainty width, and prepared atmospheric evidence for a selected cell
export function EvidencePanel({ scenario, cell, timeMin, sensorOff }: EvidencePanelProps) {
  const frame = frameAt(scenario, timeMin);
  const effectiveMask = effectiveSensorMask(sensorOff, frame.sensorHealth);
  const uncertaintyScale = widthScale(effectiveMask, frame.sensorHealth);
  const confidence = cell.firstFlash?.confidence;
  const corridorWidth = corridorWidthKm(cell, uncertaintyScale);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {confidence && <Chip variant="forecast">{confidence}</Chip>}
          <span className="num text-xs text-fg-2">{corridorWidth.toFixed(1)} km wide</span>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-fg">Why did risk increase?</h4>
        <ul className="mt-3 flex flex-col gap-3">
          {evidenceFor(cell).map((evidence) => {
            const sensor = sensorForEvidence(evidence.variable);
            return <EvidenceRow key={evidence.variable} evidence={evidence} timeMin={timeMin} unavailable={sensor !== undefined && effectiveMask[sensor]} />;
          })}
        </ul>
      </div>
    </div>
  );
}
