"use client";

import { useEffect, useRef } from "react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import { createMapEngine, type MapEngine } from "@/lib/map/engine";
import type { AppState } from "@/types/store";
import type { Scenario } from "@/types/scenario";

// keeps the hero engine fixed to the prepared first-flash narrative without coupling it to mission controls
const heroScenario = scenarioA as unknown as Scenario;

// supplies each map engine scenario key while the hero state remains permanently on scenario A
const heroScenarios: Record<Scenario["id"], Scenario> = { A: heroScenario, B: heroScenario, C: heroScenario };

// creates the immutable controls required by the map engine for its display-only landing state
function createHeroState(timeMin: number): AppState {
  const noOp = () => undefined;
  return {
    scenarioId: "A",
    timeMin,
    playing: true,
    speed: 1,
    sensorOff: { radar: false, insat: false, lightning: false, nwp: false },
    selectedCellId: null,
    horizon: 30,
    highlight: null,
    mapMode: "radar",
    layers: { districts: true, radar: true, satellite: false, flashDensity: true, corridors: true, population: false, schools: false, hospitals: false, airports: false, powerLines: false, mines: false, outdoorEvents: false, lightning: true },
    decomposition: false,
    compare: { on: false, split: 0.5 },
    panels: { xray: false, alert: false, left: false, right: false },
    xraySliceAltitudeKm: 0,
    issuedWarnings: [],
    guided: { on: false, step: 0 },
    selectScenario: noOp,
    setTime: noOp,
    setPlaying: noOp,
    setSpeed: noOp,
    toggleSensor: noOp,
    selectCell: noOp,
    setHorizon: noOp,
    highlightAsset: noOp,
    setMapMode: noOp,
    toggleLayer: noOp,
    setDecomposition: noOp,
    setCompare: noOp,
    setPanel: noOp,
    setXraySliceAltitude: noOp,
    issueWarning: noOp,
    setGuided: noOp,
    resetGuidedDemo: noOp,
  };
}

// renders an offscreen-aware, non-interactive replay through the shared canvas map engine
export function HeroMapLoop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let state = createHeroState(-60);
    let engine: MapEngine | null = null;
    let frameId: number | null = null;
    let lastTime: number | null = null;
    let intersecting = true;
    const listeners = new Set<(nextState: AppState) => void>();

    // sends timestamped scenario frames to the engine without forcing React to render
    const advance = (now: number) => {
      if (lastTime !== null) {
        const elapsedMinutes = (now - lastTime) / 1_000;
        const nextTime = state.timeMin + elapsedMinutes;
        state = createHeroState(nextTime > 60 ? -60 + (nextTime - 60) : nextTime);
        listeners.forEach((listener) => listener(state));
      }
      lastTime = now;
      if (intersecting) frameId = window.requestAnimationFrame(advance);
    };

    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry?.isIntersecting ?? false;
      engine?.setActive(intersecting);
      if (intersecting && frameId === null) {
        lastTime = null;
        frameId = window.requestAnimationFrame(advance);
      }
      if (!intersecting && frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
    }, { threshold: 0.01 });

    engine = createMapEngine({
      canvas,
      scenarios: heroScenarios,
      initialState: state,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      onCellSelect: () => undefined,
    });

    observer.observe(container);
    frameId = window.requestAnimationFrame(advance);

    return () => {
      observer.disconnect();
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      engine?.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden="true">
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  );
}
