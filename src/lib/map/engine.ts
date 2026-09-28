import type { Scenario } from "@/types/scenario";
import type { AppState } from "@/types/store";
import { baseFeatures, baseLayer, stateOutline } from "./layers/base";
import { graticuleLayer } from "./layers/graticule";
import { scaleBarLayer } from "./layers/scalebar";
import { fitProjection, frameCellsAt, hitTestCells, projectTweenAt, startProjectionTween, type MapProjection, type ProjectionTween } from "./project";
import type { MapTheme } from "./theme";
import { readMapTheme } from "./theme";

// contains the globally-owned values the imperative renderer reads for each map frame
export interface MapFrameState {
  scenario: Scenario;
  timeMin: number;
  selectedCellId: string | null;
  layers: AppState["layers"];
  backgroundColor: string;
  projection: MapProjection;
  theme: MapTheme;
  width: number;
  height: number;
  features: typeof baseFeatures;
  outline: typeof stateOutline;
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
  onCoordinateChange?: (coordinate: readonly [number, number] | null) => void;
}

// exposes the lifecycle cleanup required when the React wrapper unmounts the canvas
export interface MapEngine {
  destroy: () => void;
}

// gives the initial canvas phase a static operational surface without pre-empting future map layers
const placeholderBackground: Layer = {
  id: "placeholder-background",
  draw: (ctx, state) => {
    ctx.fillStyle = state.backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },
};

// fixes canvas composition order as later geographic layers are introduced in subsequent chunks
const staticLayers: readonly Layer[] = [placeholderBackground, graticuleLayer, baseLayer, scaleBarLayer];

// creates a device-pixel-ratio-aware canvas renderer driven entirely from mutable store state
export function createMapEngine(options: MapEngineOptions): MapEngine {
  const context = options.canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");

  const staticCanvas = document.createElement("canvas");
  const staticContext = staticCanvas.getContext("2d");
  if (!staticContext) throw new Error("Static canvas 2D context is unavailable");

  // captures the current theme surface once for use by the detached static canvas
  const theme = readMapTheme(options.canvas);
  const backgroundColor = theme.bg;
  let frameState = toFrameState(options.initialState, options.scenarios, backgroundColor, fitProjection(options.scenarios[options.initialState.scenarioId].region, 1, 1), theme, 1, 1);
  let projection = fitProjection(frameState.scenario.region, 1, 1);
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
    staticLayers.forEach((layer) => layer.draw(staticContext, frameState, 0));
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
      frameState = { ...frameState, projection };
      redrawStatic();
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.drawImage(staticCanvas, 0, 0, width, height);

    if (projectionTween) requestFrame();
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
    frameState = { ...frameState, projection, width, height };
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
      frameCellsAt(frameState.scenario, frameState.timeMin),
      projection,
      [event.clientX - bounds.left, event.clientY - bounds.top],
    );

    if (cellId) options.onCellSelect(cellId);
  };

  // updates a DOM-only readout, avoiding React work for high-frequency pointer movement
  const onPointerMove = (event: PointerEvent) => {
    const bounds = options.canvas.getBoundingClientRect();
    options.onCoordinateChange?.(projection.invert([event.clientX - bounds.left, event.clientY - bounds.top]));
  };

  const onPointerLeave = () => options.onCoordinateChange?.(null);

  // updates the RAF-owned snapshot without subscribing React to high-frequency playback state
  const unsubscribe = options.subscribe((state) => {
    const nextState = toFrameState(state, options.scenarios, backgroundColor, projection, theme, width, height);
    const scenarioChanged = nextState.scenario.id !== frameState.scenario.id;
    const districtsChanged = nextState.layers.districts !== frameState.layers.districts;
    frameState = nextState;

    if (scenarioChanged) {
      const target = fitProjection(frameState.scenario.region, width, height);
      projectionTween = startProjectionTween(projection, target, performance.now());
    } else if (districtsChanged) {
      redrawStatic();
    }

    requestFrame();
  });
  const observer = new ResizeObserver(resize);
  observer.observe(options.canvas);
  document.addEventListener("visibilitychange", onVisibilityChange);
  options.canvas.addEventListener("click", onClick);
  options.canvas.addEventListener("pointermove", onPointerMove);
  options.canvas.addEventListener("pointerleave", onPointerLeave);

  return {
    destroy: () => {
      unsubscribe();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      options.canvas.removeEventListener("click", onClick);
      options.canvas.removeEventListener("pointermove", onPointerMove);
      options.canvas.removeEventListener("pointerleave", onPointerLeave);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    },
  };
}

// extracts only the globally-owned values the canvas needs for its mutable per-frame snapshot
function toFrameState(
  state: AppState,
  scenarios: Record<Scenario["id"], Scenario>,
  backgroundColor: string,
  projection: MapProjection,
  theme: MapTheme,
  width: number,
  height: number,
): MapFrameState {
  return {
    scenario: scenarios[state.scenarioId],
    timeMin: state.timeMin,
    selectedCellId: state.selectedCellId,
    layers: state.layers,
    backgroundColor,
    projection,
    theme,
    width,
    height,
    features: baseFeatures,
    outline: stateOutline,
  };
}
