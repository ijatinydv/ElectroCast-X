"use client";

import { useEffect, useRef, useState } from "react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";
import { createMapEngine } from "@/lib/map/engine";
import type { AssetTooltip } from "@/lib/map/layers/assets";
import { useStore } from "@/store/useStore";
import type { Scenario } from "@/types/scenario";

// binds the prepared static scenario fixtures to the imperative map engine without runtime fetches
const scenarios = { A: scenarioA, B: scenarioB, C: scenarioC } as unknown as Record<Scenario["id"], Scenario>;

// mounts the imperative map engine once so canvas frames never cause React component renders
export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coordinateRef = useRef<HTMLOutputElement>(null);
  const hoveredAssetRef = useRef<string | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<AssetTooltip | null>(null);

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
      },
    });

    // updates the coordinate directly and changes React tooltip state only when the hovered asset changes
    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const point: [number, number] = [event.clientX - bounds.left, event.clientY - bounds.top];
      const coordinate = engine.coordinateAt(point);
      if (coordinateRef.current) coordinateRef.current.value = coordinate ? formatCoordinate(coordinate) : "";
      const asset = engine.assetAt(point);
      if (asset?.id !== hoveredAssetRef.current) {
        hoveredAssetRef.current = asset?.id ?? null;
        setHoveredAsset(asset);
      }
    };

    // removes the stale coordinate when the pointer leaves the map canvas
    const onPointerLeave = () => {
      if (coordinateRef.current) coordinateRef.current.value = "";
      hoveredAssetRef.current = null;
      setHoveredAsset(null);
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
      {hoveredAsset && <AssetTooltipOverlay asset={hoveredAsset} />}
      <output ref={coordinateRef} aria-live="off" className="pointer-events-none absolute bottom-3 left-3 min-w-28 text-xs text-fg-3 num" />
    </div>
  );
}

// formats the map pointer location as a compact longitude and latitude readout
function formatCoordinate([longitude, latitude]: readonly [number, number]): string {
  return `${longitude.toFixed(3)}°, ${latitude.toFixed(3)}°`;
}

// displays source-labelled exposure context next to a canvas asset without adding DOM map markers
function AssetTooltipOverlay({ asset }: { asset: AssetTooltip }) {
  return (
    <div className="pointer-events-none absolute z-10 border border-line bg-rail px-2 py-1.5 text-xs text-fg shadow-none" style={{ left: asset.point[0] + 10, top: asset.point[1] + 10 }}>
      <div className="font-medium">{asset.name}</div>
      <div className="text-fg-2">{asset.type}{asset.population !== undefined ? <span className="num"> · {asset.population.toLocaleString()} people</span> : null}</div>
      {asset.synthetic && <span className="mt-1 inline-flex rounded-full border border-line px-1.5 py-0.5 text-[10px] leading-none text-fg-2">synthetic</span>}
    </div>
  );
}
