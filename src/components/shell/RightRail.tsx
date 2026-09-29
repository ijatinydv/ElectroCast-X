"use client";
import * as React from "react";
import { Panel } from "@/components/ui/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CellHeader } from "@/components/panels/CellHeader";
import { CountdownPanel } from "@/components/panels/CountdownPanel";
import { EvidencePanel } from "@/components/panels/EvidencePanel";
import { ExposurePanel } from "@/components/panels/ExposurePanel";
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
  const setPanel = useStore((state) => state.setPanel);
  const scenario = scenarios[scenarioId];
  const cell = selectedCellId ? frameAt(scenario, timeMin).cells.find((candidate) => candidate.id === selectedCellId) : undefined;

  return (
    <ScrollArea className="h-full bg-rail border-l border-line">
      <div className="flex flex-col">
        {cell ? <CellHeader cell={cell} /> : <div className="p-4 text-sm text-fg-2">Select a storm cell on the map.</div>}
        {cell && <Panel title={cell.mode === "active" ? "Active storm" : "When"} defaultOpen={true}><CountdownPanel scenario={scenario} cell={cell} timeMin={timeMin} sensorOff={sensorOff} /></Panel>}
        <Panel title="Where" defaultOpen={true}>
          <div className="text-sm text-fg-2">Corridor summary available when a storm cell is selected.</div>
        </Panel>
        <Panel title="How sure, and why" defaultOpen={true}>
          {cell ? <EvidencePanel scenario={scenario} cell={cell} timeMin={timeMin} sensorOff={sensorOff} /> : <div className="text-sm text-fg-2">Select a storm cell on the map.</div>}
        </Panel>
        <Panel title="Exposure" defaultOpen={true}>
          {cell ? <ExposurePanel cell={cell} /> : <div className="text-sm text-fg-2">Select a storm cell to assess affected places.</div>}
        </Panel>
        <Panel title="Actions" defaultOpen={true} collapsible={false}>
          <div className="flex flex-col gap-3">
            <Button variant="default" className="w-full">Create warning</Button>
            <Button disabled={!cell} onClick={() => setPanel("xray", true)} variant="outline" className="w-full">Open storm X-ray</Button>
          </div>
        </Panel>
      </div>
    </ScrollArea>
  );
}
