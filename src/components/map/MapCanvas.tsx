"use client";

import { useEffect, useRef } from "react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";
import { createMapEngine } from "@/lib/map/engine";
import { useStore } from "@/store/useStore";
import type { Scenario } from "@/types/scenario";

// binds the prepared static scenario fixtures to the imperative map engine without runtime fetches
const scenarios = { A: scenarioA, B: scenarioB, C: scenarioC } as unknown as Record<Scenario["id"], Scenario>;

// mounts the imperative map engine once so canvas frames never cause React component renders
export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createMapEngine({
      canvas,
      scenarios,
      initialState: useStore.getState(),
      subscribe: (listener) => useStore.subscribe(listener),
      onCellSelect: (cellId) => {
        useStore.getState().selectCell(cellId);
        console.info("Selected map cell", cellId);
      },
    });

    return () => engine.destroy();
  }, []);

  return <canvas ref={canvasRef} className="block h-full w-full" aria-label="Scenario map" />;
}
