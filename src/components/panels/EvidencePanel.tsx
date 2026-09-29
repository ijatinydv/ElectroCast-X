import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Sparkline } from "@/components/ui/Sparkline";
import { cn } from "@/lib/utils";
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
    <li className={cn(
      "rounded border p-2.5 transition-colors",
      unavailable 
        ? "border-line/50 bg-raised/20 text-fg-3" 
        : "border-line bg-raised/30 text-fg hover:border-line-strong"
    )}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <DirectionIcon direction={evidence.direction} />
          <span className="text-xs font-medium truncate">{evidence.label}</span>
        </div>
        {unavailable ? (
          <span className="text-[10px] font-mono text-fg-3 uppercase tracking-wider bg-raised px-1.5 py-0.5 rounded border border-line">
            {unavailableSensorLabel(evidence.variable)}
          </span>
        ) : (
          <span className="num text-xs text-fg-2 font-medium bg-raised/80 px-1.5 py-0.5 rounded border border-line/60">
            {delta}
          </span>
        )}
      </div>
      <div className="flex justify-end pt-1">
        <Sparkline aria-label={`${evidence.label} trend`} values={evidence.sparkline} markerIndex={markerIndex} color={trendColor} width={128} height={26} />
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
