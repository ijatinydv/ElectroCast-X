"use client";
import * as React from "react";
import { Panel } from "@/components/ui/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/store/useStore";
import type { LayerId } from "@/types/store";

// exposes the globally coordinated map layers without creating a second source of display state
export function LeftRail() {
  const mapMode = useStore((state) => state.mapMode);
  const layers = useStore((state) => state.layers);
  const setMapMode = useStore((state) => state.setMapMode);
  const toggleLayer = useStore((state) => state.toggleLayer);
  const sensorOff = useStore((state) => state.sensorOff);
  const toggleSensor = useStore((state) => state.toggleSensor);

  return (
    <ScrollArea className="h-full bg-rail border-r border-line">
      <div className="flex flex-col">
        <Panel title="Scenarios" defaultOpen={true}>
          <div className="text-sm text-fg-2">Placeholder scenarios list</div>
        </Panel>
        <Panel title="Layers" defaultOpen={true}>
          <div className="flex flex-col gap-3 text-sm text-fg-2">
            <div className="grid grid-cols-2 border border-line rounded-md p-0.5" role="group" aria-label="Storm display mode">
              <button type="button" onClick={() => setMapMode("radar")} aria-pressed={mapMode === "radar"} className={mapMode === "radar" ? "rounded bg-raised px-2 py-1 text-fg" : "rounded px-2 py-1"}>Radar</button>
              <button type="button" onClick={() => setMapMode("satellite")} aria-pressed={mapMode === "satellite"} className={mapMode === "satellite" ? "rounded bg-raised px-2 py-1 text-fg" : "rounded px-2 py-1"}>Satellite</button>
            </div>
            <LayerToggle label="Radar cells" layerId="radar" checked={layers.radar} onCheckedChange={toggleLayer} />
            <LayerToggle label="Satellite cloud tops" layerId="satellite" checked={layers.satellite} onCheckedChange={toggleLayer} />
            <LayerToggle label="Flash density" layerId="flashDensity" checked={layers.flashDensity} onCheckedChange={toggleLayer} />
          </div>
        </Panel>
        <Panel title="Sensors" defaultOpen={true}>
          {process.env.NODE_ENV === "development" ? (
            <button type="button" onClick={() => toggleSensor("radar")} className="w-full rounded border border-line px-2 py-1 text-left text-sm text-fg-2 hover:text-fg">
              {sensorOff.radar ? "Restore radar sensor" : "Disable radar sensor"}
            </button>
          ) : <div className="text-sm text-fg-2">Sensor controls arrive in the sensor lab.</div>}
        </Panel>
        <Panel title="View" defaultOpen={true}>
          <div className="text-sm text-fg-2">Placeholder view options</div>
        </Panel>
      </div>
    </ScrollArea>
  );
}

// keeps each map-layer switch accessible while routing changes through the shared store action
function LayerToggle({ label, layerId, checked, onCheckedChange }: { label: string; layerId: LayerId; checked: boolean; onCheckedChange: (layerId: LayerId) => void }) {
  return <label className="flex items-center justify-between gap-3"><span>{label}</span><Switch size="sm" checked={checked} onCheckedChange={() => onCheckedChange(layerId)} aria-label={`Toggle ${label}`} /></label>;
}
