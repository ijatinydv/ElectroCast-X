import type { Scenario } from "@/types/scenario";
import type { AppState } from "@/types/store";
import { baseLayer } from "./layers/base";
import { graticuleLayer } from "./layers/graticule";
import { heatmapLayer } from "./layers/heatmap";
import { radarLayer } from "./layers/radar";
import { scaleBarLayer } from "./layers/scalebar";
import { satelliteLayer } from "./layers/satellite";
import { frameAt } from "./interpolate";
import { fitProjection, hitTestCells, projectTweenAt, startProjectionTween, type MapProjection, type ProjectionTween } from "./project";
import { getStormSprites } from "./sprites";
import { readMapTheme, type MapTheme } from "./theme";

// contains the globally-owned values the imperative renderer reads for each map frame
export interface MapFrameState {
  scenario: Scenario;
  timeMin: number;
  frame: ReturnType<typeof frameAt>;
  selectedCellId: string | null;
  mapMode: AppState["mapMode"];
  layers: AppState["layers"];
  backgroundColor: string;
  theme: MapTheme;
  projection: MapProjection;
  width: number;
  height: number;
}

// establishes the pure draw contract all future map layers follow in fixed order
export interface Layer {
  id: string;
  draw: (ctx: CanvasRenderingContext2D, state: MapFrameState, time: number) => void;
}

// groups the DOM, store, scenario, and selection dependencies required to mount a map engine
export interface MapEngineOptions {
  canvas: HTMLCanvasElement;
  scenarios: Record<Scenario["id"], Scenario>;
  initialState: AppState;
  subscribe: (listener: (state: AppState) => void) => () => void;
  onCellSelect: (cellId: string) => void;
}

// exposes the lifecycle cleanup required when the React wrapper unmounts the canvas
export interface MapEngine {
  destroy: () => void;
  coordinateAt: (point: readonly [number, number]) => readonly [number, number] | null;
}

// fixes canvas composition order as later geographic layers are introduced in subsequent chunks
const staticLayers: readonly Layer[] = [graticuleLayer, baseLayer, scaleBarLayer];
const dynamicLayers: readonly Layer[] = [satelliteLayer, radarLayer, heatmapLayer];

// creates a device-pixel-ratio-aware canvas renderer driven entirely from mutable store state
export function createMapEngine(options: MapEngineOptions): MapEngine {
  const context = options.canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");

  const staticCanvas = document.createElement("canvas");
  const staticContext = staticCanvas.getContext("2d");
  if (!staticContext) throw new Error("Static canvas 2D context is unavailable");

  // captures the current theme surface once for use by the detached static canvas
  const theme = readMapTheme(options.canvas);
  const backgroundColor = theme.background;
  // creates the immutable radial artwork before the timed RAF path begins
  getStormSprites();
  let projection = fitProjection(options.scenarios[options.initialState.scenarioId].region, 1, 1);
  let frameState = toFrameState(options.initialState, options.scenarios, backgroundColor, theme, projection, 1, 1);
  let projectionTween: ProjectionTween | null = null;
  let animationFrame: number | null = null;
  let visible = document.visibilityState === "visible";
  let width = 1;
  let height = 1;
  let dpr = 1;

  // renders a static layer once per resize rather than repeating its work in the animation loop
  const redrawStatic = () => {
    staticContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    staticContext.clearRect(0, 0, width, height);
    const staticState = { ...frameState, projection, width, height };
    staticLayers.forEach((layer) => layer.draw(staticContext, staticState, 0));
  };

  // schedules work only when a resize, store update, or active projection tween requires a frame
  const requestFrame = () => {
    if (visible && animationFrame === null) animationFrame = window.requestAnimationFrame(render);
  };

  // composites cached static content and keeps the loop alive only during map-owned animation
  const render = (now: number) => {
    animationFrame = null;
    if (!visible) return;

    if (projectionTween) {
      const result = projectTweenAt(projectionTween, now);
      projection = result.projection;
      if (result.complete) projectionTween = null;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.drawImage(staticCanvas, 0, 0, width, height);
    const drawStartedAt = performance.now();
    dynamicLayers.forEach((layer) => layer.draw(context, { ...frameState, projection, width, height }, now));
    const drawDuration = performance.now() - drawStartedAt;
    if (drawDuration > 4) console.warn(`Map dynamic layers exceeded 4 ms (${drawDuration.toFixed(1)} ms)`);

    if (projectionTween || mapIsAnimating(frameState)) requestFrame();
  };

  // keeps the backing store sharp while CSS owns the responsive centre-panel dimensions
  const resize = (entries: readonly ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (!entry) return;
    width = Math.max(1, Math.round(entry.contentRect.width));
    height = Math.max(1, Math.round(entry.contentRect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    options.canvas.width = Math.round(width * dpr);
    options.canvas.height = Math.round(height * dpr);
    staticCanvas.width = options.canvas.width;
    staticCanvas.height = options.canvas.height;
    projection = fitProjection(frameState.scenario.region, width, height);
    projectionTween = null;
    redrawStatic();
    requestFrame();
  };

  // pauses all canvas work when the document is no longer visible and resumes only when needed
  const onVisibilityChange = () => {
    visible = document.visibilityState === "visible";
    if (!visible && animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    if (visible) requestFrame();
  };

  // resolves a click in CSS pixels against the current frame's projected cell centres
  const onClick = (event: MouseEvent) => {
    const bounds = options.canvas.getBoundingClientRect();
    const cellId = hitTestCells(
      frameState.frame.cells,
      projection,
      [event.clientX - bounds.left, event.clientY - bounds.top],
    );

    if (cellId) options.onCellSelect(cellId);
  };

  // updates the RAF-owned snapshot without subscribing React to high-frequency playback state
  const unsubscribe = options.subscribe((state) => {
    const nextState = toFrameState(state, options.scenarios, backgroundColor, theme, projection, width, height);
    const scenarioChanged = nextState.scenario.id !== frameState.scenario.id;
    const staticLayerChanged = nextState.layers.districts !== frameState.layers.districts;
    frameState = nextState;

    if (scenarioChanged) {
      const target = fitProjection(frameState.scenario.region, width, height);
      projectionTween = startProjectionTween(projection, target, performance.now());
      redrawStatic();
    }
    if (staticLayerChanged) redrawStatic();

    requestFrame();
  });
  const observer = new ResizeObserver(resize);
  observer.observe(options.canvas);
  document.addEventListener("visibilitychange", onVisibilityChange);
  options.canvas.addEventListener("click", onClick);

  return {
    destroy: () => {
      unsubscribe();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      options.canvas.removeEventListener("click", onClick);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    },
    coordinateAt: (point) => projection.unproject(point),
  };
}

// extracts only the globally-owned values the canvas needs for its mutable per-frame snapshot
function toFrameState(state: AppState, scenarios: Record<Scenario["id"], Scenario>, backgroundColor: string, theme: MapTheme, projection: MapProjection, width: number, height: number): MapFrameState {
  return {
    scenario: scenarios[state.scenarioId],
    timeMin: state.timeMin,
    frame: frameAt(scenarios[state.scenarioId], state.timeMin),
    selectedCellId: state.selectedCellId,
    mapMode: state.mapMode,
    layers: state.layers,
    backgroundColor,
    theme,
    projection,
    width,
    height,
  };
}

// continuous radar breathing is the only phase 2.3 animation that needs a persistent RAF
function mapIsAnimating(state: MapFrameState): boolean {
  return state.mapMode === "radar" && state.layers.radar;
}
