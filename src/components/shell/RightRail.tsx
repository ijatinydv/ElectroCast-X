"use client";
import * as React from "react";
import { Panel } from "@/components/ui/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/ui/Stat";
import { Dial } from "@/components/ui/Dial";

export function RightRail() {
  return (
    <ScrollArea className="h-full bg-rail border-l border-line">
      <div className="flex flex-col">
        <div className="p-4 border-b border-line flex flex-col gap-2">
          <div className="text-sm font-mono num text-fg">Cell C-A07</div>
        </div>
        
        <Panel title="When" defaultOpen={true}>
          <div className="flex justify-center py-4">
            <Dial probability={71} windowStart={18} windowEnd={27} />
          </div>
        </Panel>
        
        <Panel title="Where" defaultOpen={true}>
          <div className="text-sm text-fg-2">Corridor summary</div>
        </Panel>
        
        <Panel title="How sure, and why" defaultOpen={true}>
          <div className="flex flex-col gap-4">
            <Stat label="Confidence" value="Moderate" />
            <div className="text-sm text-fg-2">Physical evidence list</div>
          </div>
        </Panel>
        
        <Panel title="Exposure" defaultOpen={true}>
          <div className="text-sm text-fg-2">Affected region</div>
        </Panel>
        
        <div className="p-4 flex flex-col gap-3">
          <Button variant="default" className="w-full">Create warning</Button>
          <Button variant="outline" className="w-full">Open storm X-ray</Button>
        </div>
      </div>
    </ScrollArea>
  );
}
