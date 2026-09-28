"use client";

import { useEffect, useRef } from "react";
import { createMapEngine, type MapEngine } from "@/lib/map/engine";
import { useStore } from "@/store/useStore";

// Keeps map lifecycle imperative so animation frames do not trigger React renders.
export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const engine: MapEngine = createMapEngine(canvas);
    const onClick = (event: MouseEvent) => {
      const cellId = engine.hitTest(event.clientX, event.clientY);
      console.info("Map cell selected", cellId);
      useStore.getState().selectCell(cellId);
    };
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("click", onClick);
      engine.destroy();
    };
  }, []);

  return <div id="map-slot" className="relative h-full w-full overflow-hidden bg-bg"><canvas ref={canvasRef} className="block h-full w-full" aria-label="Odisha mission map" /></div>;
}
