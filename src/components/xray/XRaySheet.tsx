"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// presents the selected cell's lazy digital twin above the Mission Control map
export function XRaySheet() {
  const open = useStore((state) => state.panels.xray);
  const setPanel = useStore((state) => state.setPanel);
  const scenarioId = useStore((state) => state.scenarioId);
  const timeMin = useStore((state) => state.timeMin);
  const selectedCellId = useStore((state) => state.selectedCellId);
  const cell = selectedCellId ? frameAt(scenarios[scenarioId], timeMin).cells.find((candidate) => candidate.id === selectedCellId) : undefined;

  if (!open || !cell) return null;

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
      <div className="min-h-0 flex-1 bg-bg">
        <StormScene cell={cell} />
      </div>
    </section>
  );
}
