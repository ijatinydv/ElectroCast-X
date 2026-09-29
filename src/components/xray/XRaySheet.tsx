"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AltitudeSlider } from "@/components/xray/AltitudeSlider";
import { XRayControls } from "@/components/xray/XRayControls";
import type { XRayFeatureVisibility } from "@/components/xray/XRayControls";
import { sliceReadoutFor } from "@/lib/derive/volume";
import { frameAt } from "@/lib/map/interpolate";
import { useStore } from "@/store/useStore";
import type { Scenario } from "@/types/scenario";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";

// separates the Three runtime from the X-ray shell until an operator opens it
const StormScene = dynamic(() => import("./StormScene").then((module) => module.StormScene), { ssr: false });

// retains the prepared scenario records for the X-ray's shared-state lookup
const scenarios: Record<"A" | "B" | "C", Scenario> = {
  A: scenarioA as unknown as Scenario,
  B: scenarioB as unknown as Scenario,
  C: scenarioC as unknown as Scenario,
};

// starts every physical layer visible while keeping display choices local to the sheet
const initialFeatures: XRayFeatureVisibility = {
  reflectivity: true,
  zdrColumn: true,
  kdpCore: true,
  updraft: true,
  mixedPhase: true,
  flashes: true,
};

// presents the selected cell's lazy digital twin above the Mission Control map
export function XRaySheet() {
  const open = useStore((state) => state.panels.xray);
  const setPanel = useStore((state) => state.setPanel);
  const scenarioId = useStore((state) => state.scenarioId);
  const timeMin = useStore((state) => state.timeMin);
  const selectedCellId = useStore((state) => state.selectedCellId);
  const frame = frameAt(scenarios[scenarioId], timeMin);
  const cell = selectedCellId ? frame.cells.find((candidate) => candidate.id === selectedCellId) : undefined;
  const [sliceAltitudeKm, setSliceAltitudeKm] = React.useState(0);
  const [features, setFeatures] = React.useState<XRayFeatureVisibility>(initialFeatures);

  React.useEffect(() => {
    if (cell) setSliceAltitudeKm(cell.freezingLevelKm);
  }, [cell?.id, cell?.freezingLevelKm]);

  if (!open || !cell) return null;
  const readout = sliceReadoutFor(cell, sliceAltitudeKm);

  return (
    <section aria-label="Storm X-ray" className="absolute inset-0 z-30 flex min-h-0 flex-col border border-line bg-bg xl:left-[264px] xl:right-[336px]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
        <div>
          <h2 className="text-sm font-medium text-fg">Storm X-ray</h2>
          <p className="text-xs text-fg-2">Simulated demo scenario · <span className="num">{cell.id}</span> reflectivity volume</p>
        </div>
        <Button aria-label="Close storm X-ray" onClick={() => setPanel("xray", false)} size="icon-sm" variant="outline">
          <X />
        </Button>
      </header>
      <div className="relative flex min-h-0 flex-1 bg-bg">
        <AltitudeSlider altitudeKm={sliceAltitudeKm} echoTopKm={cell.echoTopKm} freezingLevelKm={cell.freezingLevelKm} onAltitudeChange={setSliceAltitudeKm} />
        <div className="min-w-0 flex-1">
          <StormScene cell={cell} features={features} flashes={frame.lightning} predictedFlashes={frame.kind === "forecast"} sliceAltitudeKm={sliceAltitudeKm} />
        </div>
        <div className="absolute right-4 top-4">
          <XRayControls features={features} onFeatureChange={(feature, visible) => setFeatures((current) => ({ ...current, [feature]: visible }))} />
        </div>
        <aside aria-label="Slice readout" className="absolute bottom-4 right-4 w-52 border border-line bg-bg/95 p-3">
          <p className="mb-3 text-xs font-medium text-fg">Slice readout</p>
          <dl className="space-y-2 text-xs">
            <div className="flex items-baseline justify-between gap-3"><dt className="text-fg-2">Reflectivity</dt><dd className="num text-fg">{readout.reflectivityDbz.toFixed(1)} dBZ</dd></div>
            <div className="flex items-baseline justify-between gap-3"><dt className="text-fg-2">ZDR</dt><dd className="num text-fg">{readout.zdrDb.toFixed(2)} dB</dd></div>
            <div className="flex items-baseline justify-between gap-3"><dt className="text-fg-2">KDP</dt><dd className="num text-fg">{readout.kdpDegKm.toFixed(2)} °/km</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
