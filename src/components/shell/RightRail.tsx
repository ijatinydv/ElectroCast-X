"use client";
import * as React from "react";
import { Panel } from "@/components/ui/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CellHeader } from "@/components/panels/CellHeader";
import { CountdownPanel } from "@/components/panels/CountdownPanel";
import { EvidencePanel } from "@/components/panels/EvidencePanel";
import { ExposurePanel } from "@/components/panels/ExposurePanel";
import { AlertComposer } from "@/components/alerts/AlertComposer";
import { corridorSummaryFor, effectiveSensorMask, outcomeSummaryFor } from "@/lib/derive";
import { frameAt } from "@/lib/map/interpolate";
import { useStore } from "@/store/useStore";
import type { Scenario } from "@/types/scenario";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";

// keeps the three prepared scenarios addressable from the global scenario id
const scenarios: Record<"A" | "B" | "C", Scenario> = {
  A: scenarioA as unknown as Scenario,
  B: scenarioB as unknown as Scenario,
  C: scenarioC as unknown as Scenario,
};

// renders selected-cell forecast information from the shared scenario and playback state
export function RightRail() {
  const scenarioId = useStore((state) => state.scenarioId);
  const timeMin = useStore((state) => state.timeMin);
  const selectedCellId = useStore((state) => state.selectedCellId);
  const sensorOff = useStore((state) => state.sensorOff);
  const horizon = useStore((state) => state.horizon);
  const setPanel = useStore((state) => state.setPanel);
  const compareOn = useStore((state) => state.compare.on);
  const scenario = scenarios[scenarioId];
  const frame = frameAt(scenario, timeMin);
  const cell = selectedCellId ? frame.cells.find((candidate) => candidate.id === selectedCellId) : undefined;
  const effectiveMask = effectiveSensorMask(sensorOff, frame.sensorHealth);
  const outcomeSummary = outcomeSummaryFor(scenario);
  const corridorSummary = cell ? corridorSummaryFor(cell, horizon, effectiveMask, frame.sensorHealth) : null;

  return (
    <ScrollArea className="h-full bg-rail border-l border-line">
      <div className="flex flex-col">
        {cell ? <CellHeader cell={cell} /> : <NoSelectionSummary cells={frame.cells} scenarioStory={scenario.story} />}
        {compareOn && outcomeSummary && <div className="border-b border-line px-4 py-3 text-sm text-fg-2">First flash observed at <span className="num">+{outcomeSummary.firstFlashMin} min</span>, {outcomeSummary.insidePrediction ? "inside" : "outside"} the <span className="num">{outcomeSummary.windowMin[0]}–{outcomeSummary.windowMin[1]} min</span> window</div>}
        {cell && <Panel title={cell.mode === "active" ? "Active storm" : "When"} defaultOpen={true}><CountdownPanel scenario={scenario} cell={cell} timeMin={timeMin} sensorOff={effectiveMask} /></Panel>}
        <Panel title="Where" defaultOpen={true}>
          {corridorSummary ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded border border-line bg-raised/30 p-2.5">
                <VectorCompass deg={corridorSummary.directionDeg} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono text-fg-3 uppercase tracking-wider">Advection Vector</div>
                  <div className="text-sm font-medium text-fg num">
                    {corridorSummary.speedKmh} km/h · {corridorSummary.directionDeg}°
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-1">
                <div>
                  <div className="text-[11px] font-mono text-fg-3 uppercase">Arrival estimate</div>
                  <div className="num text-base font-medium text-fg">+{corridorSummary.arrivalMin} min</div>
                </div>
                <div>
                  <div className="text-[11px] font-mono text-fg-3 uppercase">Corridor width</div>
                  <div className="num text-base font-medium text-fg">±{corridorSummary.widthKm} km</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-fg-2">Select a storm cell on the map to inspect its forecast corridor.</div>
          )}
        </Panel>
        <Panel title="How sure, and why" defaultOpen={true}>
          {cell ? <EvidencePanel scenario={scenario} cell={cell} timeMin={timeMin} sensorOff={sensorOff} /> : <div className="text-sm text-fg-2">Select a storm cell on the map.</div>}
        </Panel>
        <Panel title="Exposure" defaultOpen={true}>
          {cell ? <ExposurePanel cell={cell} /> : <div className="text-sm text-fg-2">Select a storm cell to assess affected places.</div>}
        </Panel>
        <Panel title="Actions" defaultOpen={true} collapsible={false}>
          <div className="flex flex-col gap-2.5">
            <Button
              disabled={!cell}
              onClick={() => setPanel("alert", true)}
              variant="default"
              className="w-full h-10 font-semibold bg-risk text-bg hover:bg-risk/90 transition-colors shadow-sm"
            >
              Create warning
            </Button>
            <Button
              className="w-full h-9 border border-line bg-raised/40 hover:bg-raised text-fg hover:border-line-strong transition-colors"
              data-xray-trigger
              disabled={!cell}
              onClick={() => setPanel("xray", true)}
              variant="outline"
            >
              Open storm X-ray (3D)
            </Button>
          </div>
        </Panel>
      </div>
      <AlertComposer />
    </ScrollArea>
  );
}

// presents current-frame storm choices when an operator cannot use the canvas pointer
function NoSelectionSummary({ cells, scenarioStory }: { cells: Scenario["frames"][number]["cells"]; scenarioStory: string }) {
  const selectCell = useStore((state) => state.selectCell);
  return <div className="flex flex-col gap-3 border-b border-line p-4 text-sm text-fg-2"><p>{scenarioStory}</p><p>Select a storm cell on the map, or choose an available storm cell.</p><div aria-label="Available storm cells" className="flex flex-col gap-2">{cells.map((candidate) => <Button key={candidate.id} onClick={() => selectCell(candidate.id)} size="sm" variant="outline" className="justify-start"><span className="num">{candidate.id}</span><span className="ml-2">{candidate.stage}</span></Button>)}</div></div>;
}

// provides a high-density tactical compass reticle indicating storm advection heading
function VectorCompass({ deg }: { deg: number }) {
  return (
    <div className="relative size-8 rounded-full border border-line-strong bg-rail flex items-center justify-center shrink-0 shadow-inner" title={`Direction: ${deg}°`} aria-hidden="true">
      <span className="absolute top-0.5 text-[7px] font-mono text-fg-3 leading-none">N</span>
      <div
        className="size-full flex items-center justify-center"
        style={{ transform: `rotate(${deg}deg)` }}
      >
        <div className="w-0.5 h-3.5 bg-forecast rounded-full -translate-y-1" />
      </div>
      <div className="size-1 rounded-full bg-fg" />
    </div>
  );
}
