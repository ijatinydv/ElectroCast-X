import type { Frame, Scenario } from "@/types/scenario";
import type { AppState } from "@/types/store";
import { effectiveSensorMask, widthScale } from "@/lib/derive";
import { baseLayer } from "./layers/base";
import { graticuleLayer } from "./layers/graticule";
import { heatmapLayer, prepareHeatmapLayer } from "./layers/heatmap";
import { lightningLayer } from "./layers/lightning";
import { corridorsLayer } from "./layers/corridors";
import { decompositionLayer } from "./layers/decomposition";
import { labelsLayer } from "./layers/labels";
import { motionLayer } from "./layers/motion";
import { assetLocation, assetsLayer, hitTestAsset, type AssetTooltip } from "./layers/assets";
import { radarLayer } from "./layers/radar";
import { prepareSatelliteLayer, satelliteLayer } from "./layers/satellite";
import { scaleBarLayer } from "./layers/scalebar";
import { compareLayer } from "./layers/compare";
import { fitProjection, hitTestCells, panProjection, projectTweenAt, startProjectionTween, type MapProjection, type ProjectionTween } from "./project";
import { frameAt } from "./interpolate";
import { readMapTheme, type MapTheme } from "./theme";
import { getSpriteSet } from "./sprites";

// contains the globally-owned values the imperative renderer reads for each map frame
export interface MapFrameState {
  scenario: Scenario;
  timeMin: number;
  frame: Frame;
  selectedCellId: string | null;
  alertOpen: boolean;
  alertHorizon: AppState["horizon"];
  highlight: AppState["highlight"];
  decomposition: boolean;
  decompositionOpacity: number;
  mapMode: AppState["mapMode"];
  compareOn: boolean;
  compareSplit: number;
  layers: AppState["layers"];
  backgroundColor: string;
  theme: MapTheme;
  projection: MapProjection;
  width: number;
  height: number;
  corridorScale: number;
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
  onCellSelect: (cellId: string | null) => void;
  onCompareSplit?: (split: number) => void;
}

// exposes the lifecycle cleanup required when the React wrapper unmounts the canvas
export interface MapEngine {
  destroy: () => void;
  setActive: (active: boolean) => void;
  coordinateAt: (point: readonly [number, number]) => readonly [number, number] | null;
  assetAt: (point: readonly [number, number]) => AssetTooltip | null;
}

// fixes canvas composition order as later geographic layers are introduced in subsequent chunks
const staticLayers: readonly Layer[] = [graticuleLayer, baseLayer, scaleBarLayer];

// fixes dynamic composition order so decomposition explains forecast cells before paths and exposure assets
const dynamicLayers: readonly Layer[] = [satelliteLayer, radarLayer, heatmapLayer, lightningLayer, decompositionLayer, corridorsLayer, motionLayer, assetsLayer, labelsLayer];

// creates a device-pixel-ratio-aware canvas renderer driven entirely from mutable store state
export function createMapEngine(options: MapEngineOptions): MapEngine {
  const context = options.canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");

  const staticCanvas = document.createElement("canvas");
  const staticContext = staticCanvas.getContext("2d");
  if (!staticContext) throw new Error("Static canvas 2D context is unavailable");

  // captures the current theme surface once for use by the detached static canvas
  const theme = readMapTheme(options.canvas);
  getSpriteSet(theme);
  prepareSatelliteLayer();
  prepareHeatmapLayer();
  const backgroundColor = theme.background;
  let projection = fitProjection(options.scenarios[options.initialState.scenarioId].region, 1, 1);
  let frameState = toFrameState(options.initialState, options.scenarios, backgroundColor, theme, projection, 1, 1);
  let projectionTween: ProjectionTween | null = null;
  // retains the previous scenario render inputs until the layer cross-fade completes
  let scenarioFade: { frameState: MapFrameState; projection: MapProjection; staticCanvas: HTMLCanvasElement; startedAt: number } | null = null;
  let highlightPulse: { point: [number, number]; startedAt: number } | null = null;
  let animationFrame: number | null = null;
  let visible = document.visibilityState === "visible";
  let active = true;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let measuredStormFrames = 0;
  let corridorScale = frameState.corridorScale;
  let corridorScaleFrom = corridorScale;
  let corridorScaleTo = corridorScale;
  let corridorScaleStartedAt: number | null = null;
  let decompositionOpacity = frameState.decompositionOpacity;
  let decompositionOpacityFrom = decompositionOpacity;
  let decompositionOpacityTo = decompositionOpacity;
  let decompositionStartedAt: number | null = null;
  let draggingDivider = false;
  let suppressClick = false;

  // renders a static layer once per resize rather than repeating its work in the animation loop
  const redrawStatic = () => {
    staticContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    staticContext.clearRect(0, 0, width, height);
    const staticState = { ...frameState, projection, width, height };
    staticLayers.forEach((layer) => layer.draw(staticContext, staticState, 0));
  };

  // schedules work only when a resize, store update, or active projection tween requires a frame
  const requestFrame = () => {
    if (active && visible && animationFrame === null) animationFrame = window.requestAnimationFrame(render);
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
    if (corridorScaleStartedAt !== null) {
      const progress = Math.min(1, Math.max(0, (now - corridorScaleStartedAt) / 400));
      const eased = 1 - Math.pow(1 - progress, 3);
      corridorScale = corridorScaleFrom + (corridorScaleTo - corridorScaleFrom) * eased;
      if (progress === 1) corridorScaleStartedAt = null;
    }
    if (decompositionStartedAt !== null) {
      const progress = Math.min(1, Math.max(0, (now - decompositionStartedAt) / 250));
      const eased = 1 - Math.pow(1 - progress, 3);
      decompositionOpacity = decompositionOpacityFrom + (decompositionOpacityTo - decompositionOpacityFrom) * eased;
      if (progress === 1) decompositionStartedAt = null;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    const fadingScenario = scenarioFade;
    const fadeProgress = fadingScenario ? Math.min(1, Math.max(0, (now - fadingScenario.startedAt) / 300)) : 1;
    if (fadingScenario) {
      context.save();
      context.globalAlpha = 1 - fadeProgress;
      context.drawImage(fadingScenario.staticCanvas, 0, 0, width, height);
      context.restore();
    }
    context.save();
    context.globalAlpha = fadeProgress;
    context.drawImage(staticCanvas, 0, 0, width, height);
    context.restore();
    const drawStartedAt = performance.now();
    if (fadingScenario) {
      context.save();
      context.globalAlpha = 1 - fadeProgress;
      dynamicLayers.forEach((layer) => layer.draw(context, { ...fadingScenario.frameState, projection: fadingScenario.projection, width, height }, now));
      context.restore();
    }
    context.save();
    context.globalAlpha = fadeProgress;
    const dynamicState = { ...frameState, projection, width, height, corridorScale, decompositionOpacity };
    if (dynamicState.compareOn) {
      context.beginPath();
      context.rect(0, 0, width * dynamicState.compareSplit, height);
      context.clip();
      dynamicLayers.forEach((layer) => layer.draw(context, dynamicState, now));
      context.restore();
      compareLayer.draw(context, dynamicState, now);
      drawCompareDivider(context, dynamicState);
    } else {
      dynamicLayers.forEach((layer) => layer.draw(context, dynamicState, now));
      context.restore();
    }
    if (highlightPulse && now - highlightPulse.startedAt < 800) drawHighlightPulse(context, projection.project(highlightPulse.point), now - highlightPulse.startedAt);
    else highlightPulse = null;
    const drawDuration = performance.now() - drawStartedAt;
    if (measuredStormFrames >= 2 && drawDuration > 4) console.warn(`Map storm-layer draw exceeded 4 ms: ${drawDuration.toFixed(2)} ms`);
    measuredStormFrames += 1;

    if (fadeProgress === 1) scenarioFade = null;
    if (projectionTween || scenarioFade || highlightPulse || corridorScaleStartedAt !== null || decompositionStartedAt !== null || hasStormAnimation(frameState)) requestFrame();
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
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const bounds = options.canvas.getBoundingClientRect();
    const cellId = hitTestCells(
      frameState.frame.cells,
      projection,
      [event.clientX - bounds.left, event.clientY - bounds.top],
    );

    options.onCellSelect(cellId);
  };

  // updates the shared split from a pointer while preserving normal map selection away from the handle
  const updateDividerFromPointer = (event: PointerEvent) => {
    const bounds = options.canvas.getBoundingClientRect();
    options.onCompareSplit?.(Math.min(0.95, Math.max(0.05, (event.clientX - bounds.left) / bounds.width)));
  };

  // begins a divider drag only when the pointer targets its visible canvas handle
  const onPointerDown = (event: PointerEvent) => {
    if (!frameState.compareOn) return;
    const bounds = options.canvas.getBoundingClientRect();
    const dividerX = bounds.left + bounds.width * frameState.compareSplit;
    if (Math.abs(event.clientX - dividerX) > 16) return;
    draggingDivider = true;
    suppressClick = true;
    options.canvas.setPointerCapture(event.pointerId);
    updateDividerFromPointer(event);
  };

  // continues a canvas-native divider drag without mounting another map or DOM overlay
  const onPointerMove = (event: PointerEvent) => {
    if (!draggingDivider) return;
    updateDividerFromPointer(event);
  };

  // releases a completed divider drag and restores ordinary map pointer behavior
  const onPointerUp = (event: PointerEvent) => {
    if (!draggingDivider) return;
    draggingDivider = false;
    options.canvas.releasePointerCapture(event.pointerId);
  };

  // exposes the divider's split to keyboard users when compare mode is enabled
  const onKeyDown = (event: KeyboardEvent) => {
    if (!frameState.compareOn) return;
    const next = event.key === "ArrowLeft" ? frameState.compareSplit - 0.05
      : event.key === "ArrowRight" ? frameState.compareSplit + 0.05
        : event.key === "Home" ? 0.05
          : event.key === "End" ? 0.95 : null;
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    options.onCompareSplit?.(Math.min(0.95, Math.max(0.05, next)));
  };

  // updates the RAF-owned snapshot without subscribing React to high-frequency playback state
  const unsubscribe = options.subscribe((state) => {
    const previousFrameState = frameState;
    const nextState = toFrameState(state, options.scenarios, backgroundColor, theme, projection, width, height);
    const scenarioChanged = nextState.scenario.id !== frameState.scenario.id;
    const staticLayerChanged = nextState.layers.districts !== frameState.layers.districts;
    if (nextState.corridorScale !== corridorScaleTo) {
      corridorScaleFrom = corridorScale;
      corridorScaleTo = nextState.corridorScale;
      corridorScaleStartedAt = performance.now();
    }
    if (nextState.decomposition !== frameState.decomposition) {
      decompositionOpacityFrom = decompositionOpacity;
      decompositionOpacityTo = nextState.decomposition ? 1 : 0;
      decompositionStartedAt = performance.now();
    }
    if (nextState.highlight && nextState.highlight.sequence !== frameState.highlight?.sequence) {
      const location = assetLocation(nextState.highlight.assetId);
      if (location) {
        highlightPulse = { point: location, startedAt: performance.now() };
        projectionTween = startProjectionTween(projection, panProjection(projection, location, width, height), performance.now());
      }
    }
    frameState = nextState;

    if (scenarioChanged) {
      const target = fitProjection(frameState.scenario.region, width, height);
      const previousStaticCanvas = document.createElement("canvas");
      previousStaticCanvas.width = staticCanvas.width;
      previousStaticCanvas.height = staticCanvas.height;
      const previousStaticContext = previousStaticCanvas.getContext("2d");
      if (previousStaticContext) previousStaticContext.drawImage(staticCanvas, 0, 0);
      scenarioFade = { frameState: previousFrameState, projection, staticCanvas: previousStaticCanvas, startedAt: performance.now() };
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
  options.canvas.addEventListener("pointerdown", onPointerDown);
  options.canvas.addEventListener("pointermove", onPointerMove);
  options.canvas.addEventListener("pointerup", onPointerUp);
  options.canvas.addEventListener("keydown", onKeyDown);

  return {
    destroy: () => {
      unsubscribe();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      options.canvas.removeEventListener("click", onClick);
      options.canvas.removeEventListener("pointerdown", onPointerDown);
      options.canvas.removeEventListener("pointermove", onPointerMove);
      options.canvas.removeEventListener("pointerup", onPointerUp);
      options.canvas.removeEventListener("keydown", onKeyDown);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    },
    setActive: (nextActive) => {
      active = nextActive;
      if (!active && animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      if (active) requestFrame();
    },
    coordinateAt: (point) => projection.unproject(point),
    assetAt: (point) => hitTestAsset({ ...frameState, projection, width, height, corridorScale }, point),
  };
}

// extracts only the globally-owned values the canvas needs for its mutable per-frame snapshot
function toFrameState(state: AppState, scenarios: Record<Scenario["id"], Scenario>, backgroundColor: string, theme: MapTheme, projection: MapProjection, width: number, height: number): MapFrameState {
  const scenario = scenarios[state.scenarioId];
  const frame = frameAt(scenario, state.timeMin);
  return {
    scenario,
    timeMin: state.timeMin,
    frame,
    selectedCellId: state.selectedCellId,
    alertOpen: state.panels.alert,
    alertHorizon: state.horizon,
    highlight: state.highlight,
    decomposition: state.decomposition,
    decompositionOpacity: state.decomposition ? 1 : 0,
    mapMode: state.mapMode,
    compareOn: state.compare.on,
    compareSplit: state.compare.split,
    layers: state.layers,
    backgroundColor,
    theme,
    projection,
    width,
    height,
    corridorScale: widthScale(effectiveSensorMask(state.sensorOff, frame.sensorHealth), frame.sensorHealth),
  };
}

// paints the one-pixel boundary, grab handle, and corner labels for comparison orientation
function drawCompareDivider(context: CanvasRenderingContext2D, state: MapFrameState): void {
  const splitX = state.width * state.compareSplit;
  context.save();
  context.strokeStyle = state.theme.foreground;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(splitX + 0.5, 0);
  context.lineTo(splitX + 0.5, state.height);
  context.stroke();
  context.fillStyle = state.theme.background;
  context.strokeStyle = state.theme.foreground;
  context.beginPath();
  context.arc(splitX, state.height / 2, 11, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = state.theme.foreground;
  context.fillRect(splitX - 3, state.height / 2 - 4, 1, 8);
  context.fillRect(splitX + 2, state.height / 2 - 4, 1, 8);
  context.font = `12px ${state.theme.fontSans}`;
  context.textBaseline = "top";
  context.textAlign = "left";
  context.fillText("Prediction", 12, 12);
  context.textAlign = "right";
  context.fillText("Actual", state.width - 12, 12);
  context.restore();
}

// draws a brief attention ring after a named exposure item is selected
function drawHighlightPulse(context: CanvasRenderingContext2D, point: readonly [number, number], elapsedMs: number): void {
  const progress = elapsedMs / 800;
  context.save();
  context.strokeStyle = "rgba(255, 183, 77, 0.9)";
  context.lineWidth = 2;
  context.globalAlpha = 1 - progress;
  context.beginPath();
  context.arc(point[0], point[1], 8 + progress * 28, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

// keeps the canvas RAF active only while a visible storm layer has ambient motion to render
function hasStormAnimation(state: MapFrameState): boolean {
  return state.decomposition || (state.mapMode === "radar" && state.layers.radar) || (state.mapMode === "satellite" && state.layers.satellite);
}
