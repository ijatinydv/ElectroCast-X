"use client";
import * as React from "react";
import { Panel } from "@/components/ui/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/store/useStore";

export function LeftRail() {
  const mapMode = useStore((state) => state.mapMode);
  const setMapMode = useStore((state) => state.setMapMode);
  return (
    <ScrollArea className="h-full bg-rail border-r border-line">
      <div className="flex flex-col">
        <Panel title="Scenarios" defaultOpen={true}>
          <div className="text-sm text-fg-2">Placeholder scenarios list</div>
        </Panel>
        <Panel title="Layers" defaultOpen={true}>
          <div className="grid grid-cols-2 border border-line text-xs">
            {(["radar", "satellite"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMapMode(mode)}
                aria-pressed={mapMode === mode}
                className={`px-3 py-2 text-left capitalize focus-visible:outline-none ${mapMode === mode ? "bg-raised text-fg" : "text-fg-2"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Sensors" defaultOpen={true}>
          <div className="text-sm text-fg-2">Placeholder sensor lab</div>
        </Panel>
        <Panel title="View" defaultOpen={true}>
          <div className="text-sm text-fg-2">Placeholder view options</div>
        </Panel>
      </div>
    </ScrollArea>
  );
}
