"use client";
import * as React from "react";
import { Panel } from "@/components/ui/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LeftRail() {
  return (
    <ScrollArea className="h-full bg-rail border-r border-line">
      <div className="flex flex-col">
        <Panel title="Scenarios" defaultOpen={true}>
          <div className="text-sm text-fg-2">Placeholder scenarios list</div>
        </Panel>
        <Panel title="Layers" defaultOpen={true}>
          <div className="text-sm text-fg-2">Placeholder layers controls</div>
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
