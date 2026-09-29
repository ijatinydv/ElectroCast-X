"use client";

import { Switch } from "@/components/ui/switch";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { contributionFor, effectiveSensorMask, riskFor, type SensorMask } from "@/lib/derive";
import type { Cell, Frame, Scenario, SensorId } from "@/types/scenario";

const sensorRows: readonly { id: SensorId; label: string }[] = [
  { id: "radar", label: "Doppler radar" },
  { id: "insat", label: "INSAT satellite" },
  { id: "lightning", label: "Lightning network" },
  { id: "nwp", label: "NWP forecast" },
];

const comparisonRows: readonly { label: string; mask: Partial<SensorMask> }[] = [
  { label: "All sensors", mask: {} },
  { label: "Without radar", mask: { radar: true } },
  { label: "Without satellite", mask: { insat: true } },
  { label: "Without NWP", mask: { nwp: true } },
  { label: "Without lightning network", mask: { lightning: true } },
];

interface SensorLabProps {
  scenario: Scenario;
  frame: Frame;
  cell: Cell;
  sensorOff: SensorMask;
  onToggle: (sensor: SensorId) => void;
}

// presents counterfactual source controls and scenario-derived risk without local forecast state
export function SensorLab({ scenario, frame, cell, sensorOff, onToggle }: SensorLabProps) {
  const mask = effectiveSensorMask(sensorOff, frame.sensorHealth);
  const contribution = contributionFor(scenario, cell);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {sensorRows.map(({ id, label }) => {
          const health = frame.sensorHealth[id];
          const unavailable = health.status === "offline";
          return <label key={id} className="flex items-center justify-between gap-3 text-sm"><span>{label}</span><span className="flex items-center gap-2"><span className="num text-xs text-fg-2">{health.dataAgeMin === null ? "Unavailable" : `${health.dataAgeMin} min`}</span><Switch size="sm" checked={!mask[id]} disabled={unavailable} onCheckedChange={() => onToggle(id)} aria-label={`Use ${label}`} /></span></label>;
        })}
      </div>
      <div className="border-y border-line py-3">
        <div className="mb-2 text-xs text-fg-2">Live 30-min risk</div>
        <div className="flex flex-col">
          {comparisonRows.map((row) => {
            const rowMask = effectiveSensorMask(row.mask, frame.sensorHealth);
            const current = (Object.keys(mask) as SensorId[]).every((sensor) => mask[sensor] === rowMask[sensor]);
            const risk = riskFor(scenario, cell.id, rowMask);
            return <div key={row.label} className={current ? "-mx-1 flex items-center justify-between bg-raised px-1 py-1 text-sm text-fg" : "flex items-center justify-between py-1 text-sm text-fg-2"}><span>{row.label}</span><span className="num"><NumberTicker value={risk} precision={Number.isInteger(risk) ? 0 : 2} />%</span></div>;
          })}
        </div>
      </div>
      <p className="text-sm leading-5 text-fg-2">{contribution.sentence}</p>
    </div>
  );
}
