"use client";

import * as React from "react";
import { geoCentroid, geoContains } from "d3-geo";
import { Dial } from "@/components/ui/Dial";
import { Chip } from "@/components/ui/Chip";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { countdownFor } from "@/lib/derive";
import { getOdishaDistricts } from "@/lib/geo/load";
import { frameAt } from "@/lib/map/interpolate";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import type { SensorMask } from "@/lib/derive";
import type { Cell, Scenario } from "@/types/scenario";

interface CountdownPanelProps {
  scenario: Scenario;
  cell: Cell;
  timeMin: number;
  sensorOff: SensorMask;
}

// resolves the documented district label from the forecast first-flash region
function firstFlashRegionName(region: [number, number][]): string {
  const districts = getOdishaDistricts().features;
  const polygon = { type: "Polygon" as const, coordinates: [region] };
  const containingDistrict = districts.find((district) => geoContains(district as never, geoCentroid(polygon)));
  const nearestDistrict = containingDistrict ?? districts.reduce((closest, district) => {
    const [closestLongitude, closestLatitude] = geoCentroid(closest as never);
    const [districtLongitude, districtLatitude] = geoCentroid(district as never);
    const [regionLongitude, regionLatitude] = geoCentroid(polygon);
    const closestDistance = (closestLongitude - regionLongitude) ** 2 + (closestLatitude - regionLatitude) ** 2;
    const districtDistance = (districtLongitude - regionLongitude) ** 2 + (districtLatitude - regionLatitude) ** 2;
    return districtDistance < closestDistance ? district : closest;
  });
  return nearestDistrict?.properties.district ?? "Forecast region";
}

// compares the current thirty-minute probability with the prior three keyframes
function isProbabilityRising(scenario: Scenario, cellId: string, timeMin: number): boolean {
  const current = frameAt(scenario, timeMin).cells.find((candidate) => candidate.id === cellId)?.firstFlash?.p30;
  const prior = frameAt(scenario, timeMin - 15).cells.find((candidate) => candidate.id === cellId)?.firstFlash?.p30;
  return current !== undefined && prior !== undefined && current > prior;
}

// presents active-storm fields when a cell has already produced lightning
function ActiveStorm({ cell, scenario, timeMin }: Pick<CountdownPanelProps, "cell" | "scenario" | "timeMin">) {
  const previousCell = frameAt(scenario, timeMin - 15).cells.find((candidate) => candidate.id === cell.id);
  const densityTrend = previousCell && cell.flashRate < previousCell.flashRate ? "Weakening" : "Intensifying";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs text-fg-2">Flash rate</div>
          <div className="text-2xl font-medium text-fg"><NumberTicker value={cell.flashRate} /> <span className="text-sm text-fg-2">flashes/min</span></div>
        </div>
        <Chip variant={densityTrend === "Intensifying" ? "risk" : "neutral"}>{densityTrend}</Chip>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <div className="text-xs text-fg-2">Density trend</div>
          <div className="text-fg">{densityTrend}</div>
        </div>
        <div>
          <div className="text-xs text-fg-2">Motion</div>
          <div className="num text-fg">{cell.motion.dirDeg}° at {cell.motion.speedKmh} km/h</div>
        </div>
      </div>
    </div>
  );
}

// combines the first-flash countdown and active-storm presentations in the When section
export function CountdownPanel({ scenario, cell, timeMin, sensorOff }: CountdownPanelProps) {
  const horizon = useStore((state) => state.horizon);
  const setHorizon = useStore((state) => state.setHorizon);
  const countdown = cell.mode === "first-flash" ? countdownFor(scenario, cell.id, sensorOff) : null;
  const probability = countdown ? countdown[`p${horizon}`] : cell.headlineRisk;
  const mixedPhaseGrowth = cell.evidence.find((evidence) => evidence.variable === "mixedPhaseGrowth");

  if (cell.mode === "active") return <ActiveStorm cell={cell} scenario={scenario} timeMin={timeMin} />;
  if (!countdown || !countdown.windowMin || !cell.firstFlash) return null;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Crown Jewel Telemetry Stage */}
      <div className="flex flex-col items-center justify-center p-3 rounded border border-line bg-raised/20 relative">
        <Dial
          probability={probability}
          horizon={horizon}
          rising={isProbabilityRising(scenario, cell.id, timeMin)}
          windowStart={countdown.windowMin[0]}
          windowEnd={countdown.windowMin[1]}
        />
        <div className="mt-2 text-[11px] font-mono text-fg-3 flex items-center gap-1.5">
          <span>WINDOW:</span>
          <span className="num text-fg-2 font-medium">{countdown.windowMin[0]}–{countdown.windowMin[1]} MIN</span>
          <span className="text-line-strong">|</span>
          <span className="text-risk font-medium">INITIATING</span>
        </div>
      </div>

      {/* Unified Multi-Horizon Tactical Selector */}
      <div className="grid grid-cols-3 rounded border border-line bg-raised/40 p-1" role="group" aria-label="Forecast horizon selection">
        {([15, 30, 60] as const).map((value) => {
          const isSelected = horizon === value;
          const prob = countdown[`p${value}`];
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setHorizon(value)}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded transition-colors text-center",
                isSelected
                  ? "bg-rail border border-risk/40 text-fg shadow-sm"
                  : "hover:bg-raised/70 text-fg-2"
              )}
            >
              <span className="text-[10px] font-mono text-fg-3 uppercase tracking-wider">{value} MIN</span>
              <span className={cn("text-base font-medium num mt-0.5", isSelected ? "text-risk" : "text-fg")}>
                <NumberTicker value={prob} />%
              </span>
            </button>
          );
        })}
      </div>

      {/* Atmospheric Signatures Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm border-t border-line/60 pt-3">
        <div>
          <div className="text-[11px] text-fg-3 uppercase font-mono tracking-wider">Confidence</div>
          <div className="mt-0.5"><Chip variant="forecast">{countdown.confidence}</Chip></div>
        </div>
        <div>
          <div className="text-[11px] text-fg-3 uppercase font-mono tracking-wider">Electrification</div>
          <div className="text-sm font-medium text-fg capitalize mt-0.5">{cell.stage}</div>
        </div>
        <div>
          <div className="text-[11px] text-fg-3 uppercase font-mono tracking-wider">First appeared</div>
          <div className="num text-sm text-fg mt-0.5">{cell.firstFlash.minutesSinceAppeared} min ago</div>
        </div>
        <div>
          <div className="text-[11px] text-fg-3 uppercase font-mono tracking-wider">Cooling rate</div>
          <div className="num text-sm text-fg mt-0.5">{cell.cloudTopCoolingKmin.toFixed(1)} K/min</div>
        </div>
        <div className="col-span-2 border-t border-line/40 pt-2">
          <div className="text-[11px] text-fg-3 uppercase font-mono tracking-wider">Mixed-phase growth</div>
          <div className="num text-sm text-fg mt-0.5">{mixedPhaseGrowth?.delta ?? "Unavailable"}</div>
        </div>
        <div className="col-span-2 border-t border-line/40 pt-2">
          <div className="text-[11px] text-fg-3 uppercase font-mono tracking-wider">Target region</div>
          <div className="text-sm font-medium text-fg mt-0.5">{firstFlashRegionName(cell.firstFlash.region)}</div>
        </div>
      </div>
    </div>
  );
}
