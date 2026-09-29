"use client";

import * as React from "react";
import { geoCentroid, geoContains } from "d3-geo";
import { Dial } from "@/components/ui/Dial";
import { Chip } from "@/components/ui/Chip";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { countdownFor, effectiveSensorMask } from "@/lib/derive";
import { getOdishaDistricts } from "@/lib/geo/load";
import { frameAt } from "@/lib/map/interpolate";
import type { SensorMask } from "@/lib/derive";
import type { Cell, Scenario } from "@/types/scenario";

type Horizon = 15 | 30 | 60;

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
  const [horizon, setHorizon] = React.useState<Horizon>(30);
  const sensorMask = effectiveSensorMask(sensorOff, frameAt(scenario, timeMin).sensorHealth);
  const countdown = cell.mode === "first-flash" ? countdownFor(scenario, cell.id, sensorMask) : null;
  const probability = countdown ? countdown[`p${horizon}`] : cell.headlineRisk;
  const mixedPhaseGrowth = cell.evidence.find((evidence) => evidence.variable === "mixedPhaseGrowth");

  if (cell.mode === "active") return <ActiveStorm cell={cell} scenario={scenario} timeMin={timeMin} />;
  if (!countdown || !countdown.windowMin || !cell.firstFlash) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <Dial
          probability={probability}
          horizon={horizon}
          rising={isProbabilityRising(scenario, cell.id, timeMin)}
          windowStart={countdown.windowMin[0]}
          windowEnd={countdown.windowMin[1]}
        />
      </div>
      <div className="grid grid-cols-3 rounded-md border border-line p-1" aria-label="Forecast horizon">
        {([15, 30, 60] as Horizon[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={horizon === value}
            onClick={() => setHorizon(value)}
            className={horizon === value ? "rounded-sm bg-raised py-1.5 text-xs font-medium text-fg" : "rounded-sm py-1.5 text-xs text-fg-2 hover:text-fg"}
          >
            <span className="num">{value}</span> min
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 border-y border-line py-3 text-center">
        {([15, 30, 60] as Horizon[]).map((value) => (
          <div key={value}>
            <div className="text-xs text-fg-2"><span className="num">{value}</span> min</div>
            <div className="mt-1 text-lg font-medium text-fg"><NumberTicker value={countdown[`p${value}`]} />%</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <div className="text-xs text-fg-2">Estimated window</div>
          <div className="num text-fg">{countdown.windowMin[0]}–{countdown.windowMin[1]} min</div>
        </div>
        <div>
          <div className="text-xs text-fg-2">Confidence</div>
          <Chip variant="forecast">{countdown.confidence}</Chip>
        </div>
        <div>
          <div className="text-xs text-fg-2">Electrification stage</div>
          <div className="text-fg">{cell.stage}</div>
        </div>
        <div>
          <div className="text-xs text-fg-2">First appeared</div>
          <div className="num text-fg">{cell.firstFlash.minutesSinceAppeared} min ago</div>
        </div>
        <div>
          <div className="text-xs text-fg-2">Cloud-top cooling</div>
          <div className="num text-fg">{cell.cloudTopCoolingKmin.toFixed(1)} K/min</div>
        </div>
        <div>
          <div className="text-xs text-fg-2">Mixed-phase radar growth</div>
          <div className="num text-fg">{mixedPhaseGrowth?.delta ?? "Unavailable"}</div>
        </div>
      </div>
      <div>
        <div className="text-xs text-fg-2">Expected first-flash region</div>
        <div className="text-sm text-fg">{firstFlashRegionName(cell.firstFlash.region)}</div>
      </div>
    </div>
  );
}
