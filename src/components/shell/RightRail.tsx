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
          {corridorSummary ? <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><div className="text-xs text-fg-2">Arrival estimate</div><div className="num text-fg">+{corridorSummary.arrivalMin} min</div></div>
            <div><div className="text-xs text-fg-2">Movement</div><div className="num text-fg">{corridorSummary.speedKmh} km/h</div></div>
            <div><div className="text-xs text-fg-2">Direction</div><div className="num text-fg">{corridorSummary.directionDeg}°</div></div>
            <div><div className="text-xs text-fg-2">Corridor width</div><div className="num text-fg">{corridorSummary.widthKm} km</div></div>
          </div> : <div className="text-sm text-fg-2">Select a storm cell on the map to inspect its forecast corridor.</div>}
        </Panel>
        <Panel title="How sure, and why" defaultOpen={true}>
          {cell ? <EvidencePanel scenario={scenario} cell={cell} timeMin={timeMin} sensorOff={sensorOff} /> : <div className="text-sm text-fg-2">Select a storm cell on the map.</div>}
        </Panel>
        <Panel title="Exposure" defaultOpen={true}>
          {cell ? <ExposurePanel cell={cell} /> : <div className="text-sm text-fg-2">Select a storm cell to assess affected places.</div>}
        </Panel>
        <Panel title="Actions" defaultOpen={true} collapsible={false}>
          <div className="flex flex-col gap-3">
            <Button disabled={!cell} onClick={() => setPanel("alert", true)} variant="default" className="w-full">Create warning</Button>
            <Button className="w-full" data-xray-trigger disabled={!cell} onClick={() => setPanel("xray", true)} variant="outline">Open storm X-ray</Button>
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
