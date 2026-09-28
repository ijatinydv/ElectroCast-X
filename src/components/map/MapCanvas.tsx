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
  const coordinateRef = useRef<HTMLOutputElement>(null);

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
        console.info(cellId ? "Selected map cell" : "Cleared map cell selection", cellId);
      },
    });

    // updates the overlay directly so pointer movement never asks React to rerender the map
    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const coordinate = engine.coordinateAt([event.clientX - bounds.left, event.clientY - bounds.top]);
      if (coordinateRef.current) coordinateRef.current.value = coordinate ? formatCoordinate(coordinate) : "";
    };

    // removes the stale coordinate when the pointer leaves the map canvas
    const onPointerLeave = () => {
      if (coordinateRef.current) coordinateRef.current.value = "";
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      engine.destroy();
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="Scenario map" />
      <output ref={coordinateRef} aria-live="off" className="pointer-events-none absolute bottom-3 left-3 min-w-28 text-xs text-fg-3 num" />
    </div>
  );
}

// formats the map pointer location as a compact longitude and latitude readout
function formatCoordinate([longitude, latitude]: readonly [number, number]): string {
  return `${longitude.toFixed(3)}°, ${latitude.toFixed(3)}°`;
}
