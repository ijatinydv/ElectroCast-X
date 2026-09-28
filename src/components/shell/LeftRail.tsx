"use client";
import * as React from "react";
import { Panel } from "@/components/ui/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/store/useStore";

export function LeftRail() {
  const layers = useStore((state) => state.layers); const mode = useStore((state) => state.mapMode); const sensorOff = useStore((state) => state.sensorOff); const decomposition = useStore((state) => state.decomposition); const toggleLayer = useStore((state) => state.toggleLayer); const setMapMode = useStore((state) => state.setMapMode); const toggleSensor = useStore((state) => state.toggleSensor); const setDecomposition = useStore((state) => state.setDecomposition);
  return (
    <ScrollArea className="h-full bg-rail border-r border-line">
      <div className="flex flex-col">
        <Panel title="Scenarios" defaultOpen={true}>
          <div className="text-sm text-fg-2">Placeholder scenarios list</div>
        </Panel>
        <Panel title="Layers" defaultOpen={true}>
          <div className="space-y-2 px-4 py-3"><div className="grid grid-cols-2 border border-line text-xs"><button onClick={() => setMapMode("radar")} className={mode === "radar" ? "bg-raised py-1 text-observed" : "py-1 text-fg-3"}>Radar</button><button onClick={() => setMapMode("satellite")} className={mode === "satellite" ? "border-l border-line bg-raised py-1 text-observed" : "border-l border-line py-1 text-fg-3"}>Satellite</button></div>{(["districts", "radar", "satellite", "flashDensity", "corridors", "assets", "lightning"] as const).map((id) => <label key={id} className="flex justify-between text-xs text-fg-2"><span>{id}</span><Switch size="sm" checked={layers[id]} onCheckedChange={() => toggleLayer(id)} /></label>)}</div>
        </Panel>
        <Panel title="Sensors" defaultOpen={true}>
          <div className="px-4 py-3"><label className="flex justify-between text-xs text-fg-2"><span>Radar available</span><Switch size="sm" checked={!sensorOff.radar} onCheckedChange={() => toggleSensor("radar")} /></label></div>
        </Panel>
        <Panel title="View" defaultOpen={true}>
          <div className="space-y-2 px-4 py-3"><label className="flex justify-between text-xs text-fg-2"><span>Forecast decomposition</span><Switch size="sm" checked={decomposition} onCheckedChange={setDecomposition} /></label>{decomposition && <div className="flex gap-2 text-[10px]"><span className="text-forecast">Motion</span><span className="text-risk">Growth or decay</span><span className="text-observed">New initiation</span></div>}</div>
        </Panel>
      </div>
    </ScrollArea>
  );
}
