import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";
import { frameAt } from "@/lib/map/interpolate";
import { useStore } from "@/store/useStore";
import type { Cell, Frame, Scenario } from "@/types/scenario";
import type { AppState, ScenarioId } from "@/types/store";
import { MapProjection } from "./project";

type Point = [number, number];

const scenarios: Record<ScenarioId, Scenario> = {
  A: scenarioA as unknown as Scenario,
  B: scenarioB as unknown as Scenario,
  C: scenarioC as unknown as Scenario,
};

export interface MapFrameState {
  scenario: Scenario;
  frame: Frame;
  timeMin: number;
  selectedCellId: string | null;
  projection: MapProjection;
}

// Layers are pure and ordered by the engine; later phases supply the domain rendering.
export interface Layer {
  id: string;
  draw: (ctx: CanvasRenderingContext2D, state: MapFrameState, time: number) => void;
  isStatic?: boolean;
  isAnimating?: (state: MapFrameState) => boolean;
}

export interface MapEngine {
  destroy: () => void;
  hitTest: (clientX: number, clientY: number) => string | null;
  requestRender: () => void;
}

function screenRadius(cell: Cell, projection: MapProjection): number {
  const degreesLongitude = cell.radiusKm / (111.32 * Math.max(0.1, Math.cos((cell.centroid[1] * Math.PI) / 180)));
  const centre = projection.project(cell.centroid);
  const edge = projection.project([cell.centroid[0] + degreesLongitude, cell.centroid[1]]);
  return Math.abs(edge[0] - centre[0]);
}

// Finds the closest visible cell with the required eight-pixel interaction allowance.
export function nearestCellId(cells: Cell[], projection: MapProjection, point: Point): string | null {
  let nearestId: string | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const cell of cells) {
    const [x, y] = projection.project(cell.centroid);
    const distance = Math.hypot(point[0] - x, point[1] - y);
    if (distance <= screenRadius(cell, projection) + 8 && distance < nearestDistance) {
      nearestId = cell.id;
      nearestDistance = distance;
    }
  }
  return nearestId;
}

function placeholderLayer(): Layer {
  return {
    id: "placeholder-background",
    isStatic: true,
    draw: (ctx) => {
      ctx.fillStyle = "rgb(7 11 18)";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    },
  };
}

function snapshotFromStore(state: AppState, projection: MapProjection): MapFrameState {
  const scenario = scenarios[state.scenarioId];
  return { scenario, frame: frameAt(scenario, state.timeMin), timeMin: state.timeMin, selectedCellId: state.selectedCellId, projection };
}

// Owns the only map RAF, a high-DPR canvas, and an offscreen static backing surface.
export function createMapEngine(canvas: HTMLCanvasElement, layers: Layer[] = [placeholderLayer()]): MapEngine {
  const context = canvas.getContext("2d");
  const staticCanvas = document.createElement("canvas");
  const staticContext = staticCanvas.getContext("2d");
  if (!context || !staticContext) throw new Error("Canvas 2D rendering is unavailable.");

  const staticLayers = layers.filter((layer) => layer.isStatic);
  const dynamicLayers = layers.filter((layer) => !layer.isStatic);
  let width = 1;
  let height = 1;
  let dpr = 1;
  let staticDirty = true;
  let rafId: number | null = null;
  let destroyed = false;
  let visible = !document.hidden;
  let projection = new MapProjection(scenarios[useStore.getState().scenarioId].region, width, height);
  let frameState = snapshotFromStore(useStore.getState(), projection);

  const paintStatic = () => {
    staticContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    staticContext.clearRect(0, 0, width, height);
    for (const layer of staticLayers) layer.draw(staticContext, frameState, performance.now());
    staticDirty = false;
  };

  const render = (time: number) => {
    rafId = null;
    if (destroyed || !visible) return;
    const projectionAnimating = projection.update(time);
    if (staticDirty) paintStatic();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(staticCanvas, 0, 0);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const layer of dynamicLayers) layer.draw(context, frameState, time);
    if (projectionAnimating || dynamicLayers.some((layer) => layer.isAnimating?.(frameState))) rafId = requestAnimationFrame(render);
  };

  const requestRender = () => {
    if (!destroyed && visible && rafId === null) rafId = requestAnimationFrame(render);
  };

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    staticCanvas.width = canvas.width;
    staticCanvas.height = canvas.height;
    projection.refit(frameState.scenario.region, width, height, performance.now(), 0);
    staticDirty = true;
    requestRender();
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const unsubscribe = useStore.subscribe((nextState, previousState) => {
    if (nextState.scenarioId !== previousState.scenarioId) {
      projection.refit(scenarios[nextState.scenarioId].region, width, height, performance.now());
      staticDirty = true;
    }
    frameState = snapshotFromStore(nextState, projection);
    requestRender();
  });
  const onVisibilityChange = () => {
    visible = !document.hidden;
    if (!visible && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (visible) requestRender();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);
  resize();

  return {
    requestRender,
    hitTest: (clientX, clientY) => {
      const bounds = canvas.getBoundingClientRect();
      return nearestCellId(frameState.frame.cells, projection, [clientX - bounds.left, clientY - bounds.top]);
    },
    destroy: () => {
      destroyed = true;
      unsubscribe();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
  };
}
