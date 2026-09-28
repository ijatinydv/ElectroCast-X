# 05 — Architecture

## Principle
`(scenario, timeMin, sensorMask, selectedCellId, layers) → view`. Every panel and the canvas read from one store and call pure functions. There are no other sources of truth.

## Folder map

```
src/
  app/
    layout.tsx                  fonts, MotionConfig, LazyMotion provider
    page.tsx                    landing
    mission-control/page.tsx    the product
    how-it-works/page.tsx
    validation/page.tsx
    globals.css                 tokens (@theme)
  components/
    ui/                         shadcn primitives restyled, Panel, Stat, Chip, StatusDot, Sparkline, NumberTicker, Dial
    shell/                      TopBar, LeftRail, RightRail, BottomDock, SimBanner, SensorBanner
    map/                        MapCanvas.tsx (React wrapper), MapLegend, Hover/Selection overlay
    panels/                     ScenarioList, LayerControls, SensorLab, SensorHealth, CountdownPanel, EvidencePanel, ExposurePanel, CellHeader
    xray/                       XRaySheet, StormScene (lazy), AltitudeSlider, XRayControls
    alerts/                     AlertComposer, SmsPreview, PhonePreview, CapPreview
    landing/                    Hero, HeroMapLoop, QuestionSections
    pipeline/                   PipelineDiagram
    validation/                 ReliabilityChart, SkillChart (lazy ECharts)
  store/
    useStore.ts                 Zustand store
  lib/
    derive/                     mask.ts, risk.ts, corridor.ts, countdown.ts, exposure.ts, evidence.ts (+ index.ts)
    map/                        engine.ts (loop, resize, dpr, hit-test), project.ts (d3-geo), layers/*.ts, interpolate.ts, sprites.ts
    geo/                        load.ts (typed GeoJSON access)
    i18n/                       alertTemplates.ts, format.ts (times, numerals)
  hooks/                        usePlayback.ts, useReducedMotion.ts, useHotkeys.ts
  types/                        scenario.ts, assets.ts, store.ts
  data/
    scenarios/                  a-first-flash.json, b-severe-storm.json, c-sensor-loss.json  (generated)
    geo/                        odisha-state.json, odisha-districts.json
    assets/                     synthetic-assets.json
    content/                    alerts.json (templates EN/HI/OD), pipeline.json, validation-placeholder.json
scripts/  generate-scenarios.ts, validate-scenarios.ts
tests/    derive.*.test.ts, data-invariants.test.ts
```

## Store shape (`src/store/useStore.ts`)

```ts
interface State {
  scenarioId: "A" | "B" | "C";
  timeMin: number;                  // −60…+60, continuous
  playing: boolean; speed: 1 | 2 | 4;
  sensorOff: Record<SensorId, boolean>;   // true = disabled by user
  selectedCellId: string | null;
  mapMode: "radar" | "satellite";
  layers: Record<LayerId, boolean>;
  decomposition: boolean;
  compare: { on: boolean; split: number };  // Prediction vs Actual
  panels: { xray: boolean; alert: boolean; left: boolean; right: boolean };
  issuedWarnings: { tMin: number; cellId: string; horizon: 15 | 30 | 60 }[];
  guided: { on: boolean; step: number };
}
```
Actions are small and named (`selectScenario`, `setTime`, `toggleSensor`, `selectCell`, `toggleLayer`, `issueWarning`, …). `selectScenario` resets time, selection, sensor mask and issued warnings.

## Map engine (`src/lib/map`)
- `MapCanvas` mounts one `<canvas>`. On mount it creates the engine with the projection (d3-geo `geoMercator().fitExtent` to the scenario region), sets up `ResizeObserver`, subscribes to the store, and starts the RAF loop.
- The engine keeps a mutable `frameState` (interpolated cells, corridors, flashes, mask, layers) recomputed only when store inputs change; the loop just draws it.
- Layer order (bottom to top): base (offscreen), graticule, satellite or radar, flash density, decomposition, corridors, exposure assets, lightning flashes, selection and labels.
- Hit-testing: nearest cell within radius plus 8px, computed in screen space; hover cursor and tooltip.
- The same engine powers the landing hero with a fixed looping scenario, no interaction.

## Playback
`usePlayback` advances `timeMin` at 1 minute of scenario time per second at 1× (so full range is two minutes; 4× for a fast replay). It loops or stops at +60. Dragging the scrubber pauses playback.

## Sensor lab wiring
Toggling a sensor updates `sensorOff`. `riskFor` (table lookup), `widthScale`, `countdownFor` (scales p15/p30/p60 consistently with the new 30-min risk), `contributionFor`, the top-bar dots, the banner and the X-ray layer degradation all read the same mask.

## Testing
- Unit: every derive function; monotonicity of the sensor table; countdown consistency; corridor nesting.
- Data: `tests/data-invariants.test.ts` calls the validator against all three scenarios.
- Visual: manual checklist in `docs/10-qa-checklist.md`; no snapshot tests.

## What is deliberately absent
Router state beyond three routes, server code, caching layers, i18n framework (three template strings suffice), CSS-in-JS, a UI kit beyond shadcn primitives.
