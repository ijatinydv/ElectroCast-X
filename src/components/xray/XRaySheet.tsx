"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { Button } from "@/components/ui/button";
import { AltitudeSlider } from "@/components/xray/AltitudeSlider";
import { XRayControls } from "@/components/xray/XRayControls";
import type { XRayFeatureVisibility } from "@/components/xray/XRayControls";
import { effectiveSensorMask } from "@/lib/derive";
import { sliceReadoutFor } from "@/lib/derive/volume";
import { frameAt } from "@/lib/map/interpolate";
import { useStore } from "@/store/useStore";
import type { Cell, Frame, Scenario } from "@/types/scenario";
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
  const sensorOff = useStore((state) => state.sensorOff);
  const frame = frameAt(scenarios[scenarioId], timeMin);
  const cell = selectedCellId ? frame.cells.find((candidate) => candidate.id === selectedCellId) : undefined;
  const effectiveMask = effectiveSensorMask(sensorOff, frame.sensorHealth);
  const [sliceAltitudeKm, setSliceAltitudeKm] = React.useState(0);
  const [features, setFeatures] = React.useState<XRayFeatureVisibility>(initialFeatures);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (cell) setSliceAltitudeKm(cell.freezingLevelKm);
  }, [cell?.id, cell?.freezingLevelKm]);

  React.useEffect(() => {
    if (!open) return;
    triggerRef.current = document.querySelector<HTMLElement>("[data-xray-trigger]") ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  }, [open]);

  const close = React.useCallback(() => {
    setPanel("xray", false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, [setPanel]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  return (
    <AnimatePresence>
      {open && cell && <XRaySheetContents cell={cell} close={close} effectiveRadarUnavailable={effectiveMask.radar} features={features} frame={frame} setFeatures={setFeatures} setSliceAltitudeKm={setSliceAltitudeKm} sliceAltitudeKm={sliceAltitudeKm} />}
    </AnimatePresence>
  );
}

// keeps the sheet mounted through its closing transition so Three can dispose cleanly
function XRaySheetContents({ cell, close, effectiveRadarUnavailable, features, frame, setFeatures, setSliceAltitudeKm, sliceAltitudeKm }: { cell: Cell; close: () => void; effectiveRadarUnavailable: boolean; features: XRayFeatureVisibility; frame: Frame; setFeatures: React.Dispatch<React.SetStateAction<XRayFeatureVisibility>>; setSliceAltitudeKm: React.Dispatch<React.SetStateAction<number>>; sliceAltitudeKm: number }) {
  const readout = sliceReadoutFor(cell, sliceAltitudeKm);

  return (
    <m.section animate={{ opacity: 1, y: 0 }} aria-label="Storm X-ray" className="absolute inset-0 z-30 flex min-h-0 flex-col border border-line bg-bg xl:left-[264px] xl:right-[336px]" exit={{ opacity: 0, y: 12 }} initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
        <div>
          <h2 className="text-sm font-medium text-fg">Storm X-ray</h2>
          <p className="text-xs text-fg-2">Simulated demo scenario · <span className="num">{cell.id}</span> reflectivity volume</p>
        </div>
        <Button aria-label="Close storm X-ray" autoFocus onClick={close} size="icon-sm" variant="outline">
          <X />
        </Button>
      </header>
      <div className="relative flex min-h-0 flex-1 bg-bg">
        <AltitudeSlider altitudeKm={sliceAltitudeKm} echoTopKm={cell.echoTopKm} freezingLevelKm={cell.freezingLevelKm} onAltitudeChange={setSliceAltitudeKm} />
        <div className="min-w-0 flex-1">
          <StormScene cell={cell} features={features} flashes={frame.lightning} predictedFlashes={frame.kind === "forecast"} radarAvailable={!effectiveRadarUnavailable} sliceAltitudeKm={sliceAltitudeKm} />
        </div>
        <div className="absolute right-4 top-4">
          <XRayControls features={features} onFeatureChange={(feature, visible) => setFeatures((current) => ({ ...current, [feature]: visible }))} />
        </div>
        <aside aria-label="Slice readout" className="absolute bottom-4 right-4 w-52 border border-line bg-bg/95 p-3">
          <p className="mb-3 text-xs font-medium text-fg">Slice readout</p>
          {effectiveRadarUnavailable && <p className="mb-3 text-xs font-medium text-risk">Radar unavailable</p>}
          <dl className="space-y-2 text-xs">
            <div className="flex items-baseline justify-between gap-3"><dt className="text-fg-2">Reflectivity</dt><dd className="num text-fg">{readout.reflectivityDbz.toFixed(1)} dBZ</dd></div>
            <div className="flex items-baseline justify-between gap-3"><dt className="text-fg-2">ZDR</dt><dd className="num text-fg">{readout.zdrDb.toFixed(2)} dB</dd></div>
            <div className="flex items-baseline justify-between gap-3"><dt className="text-fg-2">KDP</dt><dd className="num text-fg">{readout.kdpDegKm.toFixed(2)} °/km</dd></div>
          </dl>
        </aside>
      </div>
    </m.section>
  );
}
