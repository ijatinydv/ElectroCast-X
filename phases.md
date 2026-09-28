# phases.md — Build plan

Eight phases, 37 chunks. Finish every chunk and the product is complete end to end: landing, Mission Control (map, time machine, countdown, sensor lab, evidence, exposure, X-ray, alert composer, Prediction vs Actual), how-it-works, validation, guided demo, polished and offline-ready.

## How to use

1. Pick the next unticked chunk whose **Depends on** chunks are ticked.
2. Paste its **Prompt** into your coding agent (it will read `AGENTS.md` / `CLAUDE.md` automatically).
3. Check every line under **Verify**. Then tick the box, commit `phase X.Y: <title>`.
4. Never start a chunk before its dependencies pass verification.

Every prompt implicitly begins with this preamble, so it is not repeated:

> Work in the ElectroCast-X repo. Read `AGENTS.md` and the docs named in this prompt first. Build only this chunk; do not pre-build later chunks. Follow the design system and data contract exactly. When finished, run `npm run verify`, then walk through the Verify list and report each item as pass/fail.

## Map of phases

| Phase | Outcome | Chunks |
|---|---|---|
| 0 Foundation | Tokens, primitives, empty app shell | 0.1–0.3 |
| 1 Data and state spine | Odisha geo, three scenarios, store, derive functions, playback | 1.1–1.5 |
| 2 Mission Control map | Canvas map with storms, corridors, flashes, decomposition | 2.1–2.7 |
| 3 Core panels | Time Machine, countdown, sensor lab, evidence, exposure, scenarios | 3.1–3.6 |
| 4 Alerts | Multilingual composer, SMS, phone, CAP | 4.1–4.3 |
| 5 Storm X-ray | Procedural 3D digital twin | 5.1–5.4 |
| 6 Product surface | Landing, pipeline, validation, compare, guided demo | 6.1–6.5 |
| 7 Polish and ship | Performance, accessibility, offline, rehearsal | 7.1–7.4 |

Critical path for a short timeline: 0 → 1 → 2.1–2.5 → 3.1–3.3 → 4 → 5 → 6.1. The rest is second and third wave.

---

# Phase 0 — Foundation

### [ ] 0.1 Verify scaffold and add shadcn/ui
**Does:** Confirms the starter builds, initialises shadcn/ui, adds only the primitives we will restyle, wires `MotionConfig` and `LazyMotion`.
**Depends on:** none.
**Verify:**
- `npm install && npm run verify` passes.
- `components.json` exists; primitives installed: button, switch, tabs, tooltip, dialog, sheet, slider, scroll-area, toggle.
- `layout.tsx` wraps children in `MotionConfig reducedMotion="user"` and a client `LazyMotion features={domAnimation}` provider.
- `out/` builds and opens offline.
**Prompt:**
```text
Verify the starter builds with `npm install && npm run verify`. Then run `npx shadcn@latest init` for Tailwind v4 (no CSS variable theme overwrite of our tokens: keep our @theme in globals.css as the source of truth, map shadcn's semantic variables onto our tokens instead). Add only these primitives: button, switch, tabs, tooltip, dialog, sheet, slider, scroll-area, toggle. Create src/components/Providers.tsx (client) with MotionConfig reducedMotion="user" and LazyMotion features={domAnimation}, and use it in layout.tsx. Do not install any other dependency. Record the shadcn mapping in docs/09-decisions.md.
```

### [ ] 0.2 Design primitives and kitchen-sink page
**Does:** Restyles shadcn primitives to our tokens and builds the custom primitives (Panel, Stat, Chip, StatusDot, Sparkline, NumberTicker, Dial). Adds a hidden `/dev/kit` route showing them all.
**Depends on:** 0.1.
**Verify:**
- `/dev/kit` renders every primitive in all states (default, hover, focus, disabled, active).
- No shadow, glow, gradient or radius larger than 6px on rails/panels; chips are pills.
- Numbers use `.num`; labels sentence case; contrast passes.
- Dial animates its arc when a control changes its value (400ms) and pulses only when told `rising`.
- `/dev/kit` is excluded from navigation.
**Prompt:**
```text
Read docs/01-design-system.md and docs/03-motion-and-performance.md. Restyle the shadcn primitives to our tokens (flat, hairline borders, 6px radius on buttons/inputs, no shadows). Build in src/components/ui: Panel (flat, titled, collapsible), Stat (label + mono value + optional delta), Chip (pill; variants observed/forecast/risk/alert/neutral), StatusDot (online=observed, delayed=risk, offline=alert), Sparkline (hand-rolled SVG, no library, props: values, color, width, height, optional marker), NumberTicker (copy Magic UI number-ticker, adapt to our motion vocabulary), Dial (the first-flash dial exactly as specified: 168px ring, 15/30/60 ticks, filled arc, window segment, centre percentage, soft pulse only when rising). Create src/app/dev/kit/page.tsx demonstrating all primitives and states. No hex values in components; use theme tokens.
```

### [ ] 0.3 App shell (no data)
**Does:** Builds the Mission Control chrome: top bar, left rail, right rail, bottom dock frame, simulated chip, all with placeholder content and working collapse.
**Depends on:** 0.2.
**Verify:**
- `/mission-control` shows the exact layout from `docs/02-ui-spec.md` at 1920×1080 and 1280×720.
- Rails collapse/expand with 250ms tween; the centre area resizes without overlay.
- `SIMULATED` chip and tooltip present; clock shows IST with UTC in a tooltip.
- Below 1280px, rails become sheets; nothing breaks at 800px.
**Prompt:**
```text
Read docs/02-ui-spec.md (layout, top bar, rails, dock) and docs/01-design-system.md. Build src/components/shell: TopBar, LeftRail, RightRail, BottomDock, and src/app/mission-control/page.tsx composing them around an empty centre region (a div with bg token, id="map-slot"). Use CSS grid: 48px top bar, 264px left rail, 336px right rail, 96px dock. Rails collapse with Motion (250ms, our easing). Top bar: wordmark, SIMULATED chip with tooltip, placeholder scenario name, IST clock (mono) with UTC in a tooltip, four StatusDots (static for now), a "Guided demo" button (inert). Placeholder Panels in rails using the primitives. Under 1280px wide, rails open as sheets from top-bar buttons.
```

---

# Phase 1 — Data and state spine

### [x] 1.1 Types, validator and invariant tests
**Does:** Defines all TypeScript types from the data contract and the validator that enforces the ten invariants. Tests written first, data comes in 1.3.
**Depends on:** 0.1.
**Verify:**
- `src/types/scenario.ts`, `assets.ts`, `store.ts` match `docs/04-data-contract.md` exactly.
- `scripts/validate-scenarios.ts` exports `validate(scenario): string[]` (empty = valid) and, when run, validates every JSON in `src/data/scenarios`, exiting non-zero on any violation.
- `tests/data-invariants.test.ts` includes deliberately broken fixtures that each fail with the right message (one per invariant).
**Prompt:**
```text
Read docs/04-data-contract.md fully. Create src/types/scenario.ts (all types in the contract), src/types/assets.ts, src/types/store.ts. Implement scripts/validate-scenarios.ts exporting validate(scenario): string[] and a CLI entry that loads every JSON in src/data/scenarios and exits 1 on any error (exit 0 with a note if the folder is empty for now). Cover all ten invariants including the 16-mask monotonicity and corridor nesting. Write tests/data-invariants.test.ts using small in-memory fixtures: a valid one passes, and for each invariant a broken variant fails with a specific message. No scenario data yet.
```

### [x] 1.2 Odisha geo and synthetic assets
**Does:** Adds simplified Odisha state and district GeoJSON and a synthetic assets file, plus a typed loader.
**Depends on:** 1.1.
**Verify:**
- `src/data/geo/odisha-districts.json` totals under 150 KB, 30 districts, valid GeoJSON, coordinates inside the Odisha bbox.
- `src/data/assets/synthetic-assets.json` has villages, schools, hospitals, airports, transmission polylines, mines and outdoor events near all three scenario regions, every record has `"synthetic": true`.
- `src/lib/geo/load.ts` exports typed accessors; a test asserts counts and bbox.
- A note in `docs/09-decisions.md` records the geo source and its licence.
**Prompt:**
```text
Read docs/04-data-contract.md (Geo and assets). Obtain Odisha district boundaries from the open repository udit-001/india-maps-data (Odisha GeoJSON), check its licence and record it in docs/09-decisions.md. Simplify with mapshaper (or a small script using topology-aware simplification) so src/data/geo/odisha-districts.json is under 150 KB with all 30 districts, and derive odisha-state.json (outer outline). Write scripts/build-assets.ts that generates src/data/assets/synthetic-assets.json deterministically (seeded): about 60 invented villages with plausible Odia-region names and populations, 25 schools, 12 hospitals, real major airports may be used (Bhubaneswar, Jharsuguda), 4 transmission polylines, 6 mines in Keonjhar/Sundargarh, 8 outdoor-event sites. Cluster assets around Mayurbhanj–Keonjhar, Keonjhar–Balasore and Cuttack–Khordha so all three scenarios have exposure. Every record carries "synthetic": true. Add src/lib/geo/load.ts and tests.
```

### [x] 1.3 Scenario generator and three scenarios
**Does:** Generates the three 12-frame scenario JSON files from a seeded script, with the canonical numbers, 16-mask sensor tables and outcomes.
**Depends on:** 1.1, 1.2.
**Verify:**
- `npm run gen:data` produces `a-first-flash.json`, `b-severe-storm.json`, `c-sensor-loss.json` byte-identically on repeated runs.
- `npm run check:data` passes.
- Canonical numbers from `docs/04-data-contract.md` appear exactly (A: 42/71/89, window 18–27, first flash at +25, sensor table 71/46/63/67/69; B: 78/51/69/73/66; C: radar offline from index 5, 58% at t=0).
- Each scenario file is under 400 KB.
**Prompt:**
```text
Read docs/04-data-contract.md fully. Implement scripts/generate-scenarios.ts: a seeded PRNG (mulberry32), parametric storm-cell trajectories per scenario (A: developing cell near Mayurbhanj–Keonjhar; B: electrified storm Keonjhar → Balasore, flash rate 6 → 19/min; C: Cuttack–Khordha cell with radar failing at frame index 5), 12 keyframes each at t = −60,−50,−40,−30,−20,−10,0,10,20,30,45,60. Produce corridors (center, inner, outer for 15/30/60), decomposition weights and initiation sites, evidence rows with sparklines from the allowed variable list, lightning points, low-res flashDensity grids, sensorHealth per frame, events, outcome, and the precomputed 16-mask sensorTable using the exact formula in the contract. Hit the canonical numbers exactly at t = 0. Write the three JSON files to src/data/scenarios. Run the validator; fix generator, never the validator.
```

### [x] 1.4 Store and derive functions
**Does:** Implements the Zustand store and all pure derive functions with unit tests.
**Depends on:** 1.3.
**Verify:**
- `riskFor` returns 71/46/63/67 for scenario A masks and 78/51/69/73 for B; monotonic across all 16 masks.
- `countdownFor` keeps p15 ≤ p30 ≤ p60 and p30 equals `riskFor` for any mask.
- `widthScale` matches the formula; radar-off gives ≥ 1.35.
- `corridorFor` returns nested polygons that widen with the scale.
- `exposureFor` returns B's 3 villages, 2 schools, 1 transmission corridor, 24 min at t = 0.
- All tests pass; store actions reset correctly on `selectScenario`.
**Prompt:**
```text
Read docs/04-data-contract.md (Derived functions) and docs/05-architecture.md (Store shape). Implement src/store/useStore.ts exactly per the shape (Zustand, narrow selectors, small named actions; selectScenario resets time, selection, sensor mask and issued warnings). Implement src/lib/derive/{mask,risk,corridor,countdown,exposure,evidence,index}.ts as pure functions. countdownFor rescales p15/p30/p60 consistently when the mask lowers the 30-min risk (preserve ordering, keep p60 ≥ p30). exposureFor uses point-in-polygon on the 30-min inner corridor and the synthetic assets; arrival = distance along path / speed. Write thorough Vitest tests (the numbers in the Verify list are the assertions). No UI.
```

### [x] 1.5 Frame interpolation and playback
**Does:** Continuous-time interpolation across keyframes and a playback hook.
**Depends on:** 1.4.
**Verify:**
- `frameAt(scenario, timeMin)` returns interpolated cells (centroid, radius, reflectivity, corridors) with no snapping at keyframes; unit tests cover t between and at keyframes and clamping at ±60.
- `usePlayback` advances 1 scenario-minute per second at 1×, respects speed, stops or loops at +60, and pauses when the tab is hidden.
- Store updates from playback are throttled to ≤ 30 per second.
**Prompt:**
```text
Read docs/05-architecture.md (Playback) and docs/03-motion-and-performance.md (React rules). Implement src/lib/map/interpolate.ts with frameAt(scenario, timeMin) that linearly interpolates numeric fields, centroids, radii and corridor polygons between adjacent keyframes (corridor vertex counts are equal by construction; ease with smoothstep), passes discrete fields from the nearer keyframe, and clamps to [−60, 60]. Implement src/hooks/usePlayback.ts using requestAnimationFrame with store updates throttled to 30/s, pausing on visibilitychange. Add unit tests for interpolation. No canvas yet.
```

---

# Phase 2 — Mission Control map

### [x] 2.1 Canvas engine
**Does:** One canvas, one loop, projection, DPR handling, offscreen static layer, layer interface, hit-testing.
**Depends on:** 0.3, 1.5.
**Verify:**
- Map fills the centre region, sharp on 1× and 2× displays, resizes smoothly with rail collapse.
- Projection fits the selected scenario's region; switching scenario refits with a 400ms tween.
- RAF stops when the tab is hidden and when nothing animates.
- Clicking returns the nearest cell id (logged) within radius + 8px.
- Zero React re-renders per frame (verify with React Profiler).
**Prompt:**
```text
Read docs/03-motion-and-performance.md (Canvas rules) and docs/05-architecture.md (Map engine). Build src/lib/map/engine.ts (create/destroy, ResizeObserver, DPR capped at 2, RAF loop that idles when nothing animates and pauses when hidden, offscreen canvas for static layers, mutable frameState updated from store subscription), src/lib/map/project.ts (d3-geo geoMercator fitted to scenario region, animated refit), a Layer interface `{ id, draw(ctx, state, t) }` with fixed draw order, and hit-testing in screen space. Build src/components/map/MapCanvas.tsx (client) that mounts the canvas into #map-slot, and wire it into mission-control. Draw only a placeholder background for now. No React state per frame.
```

### [x] 2.2 Base layers
**Does:** Districts, state outline, graticule, place labels, scale bar, coordinate readout.
**Depends on:** 2.1, 1.2.
**Verify:**
- Districts render as 1px `line-strong` strokes with 11px `fg-3` labels; state outline `fg-3`.
- Static layers are pre-rendered and redrawn only on resize or layer toggle.
- Labels do not overlap at the default view; hovering shows lon/lat in mono at the bottom-left.
- Matches the "Map look" section of `docs/01-design-system.md`.
**Prompt:**
```text
Read docs/01-design-system.md (Map look). Implement layers in src/lib/map/layers: base.ts (state outline + district strokes + district labels, drawn to the offscreen canvas), graticule.ts (0.5° faint lines), scalebar.ts, and a coordinate readout overlay in MapCanvas that updates from pointer position without React re-rendering the map. Use tokens via a small src/lib/map/theme.ts that reads CSS variables once. Label placement: use district centroid, skip labels that collide (simple AABB check, larger districts first).
```

### [x] 2.3 Storm layers: radar, satellite, flash density
**Does:** Procedural radar cells, satellite cloud-top mode and the flash-density heatmap.
**Depends on:** 2.2.
**Verify:**
- Radar cells appear as soft cyan blobs (observed) and purple blobs (forecast), intensity by opacity, each with a subtle drift and breathe animation; no rainbow ramp.
- Satellite mode (mutually exclusive with radar) shows a monochrome cool-is-brighter cloud-top field tinted cyan.
- Heatmap accumulates flashes in a low-res grid, upscaled smoothly, amber.
- Scrubbing time moves and grows cells continuously; draw cost stays under 4 ms per frame at 1080p.
**Prompt:**
```text
Read docs/01-design-system.md (Map look) and docs/03-motion-and-performance.md (Canvas rules). Implement src/lib/map/sprites.ts (pre-rendered radial gradient sprites per intensity band) and layers radar.ts, satellite.ts, heatmap.ts. Radar: for each cell in frameAt(...), draw a few overlapping sprites (offsets seeded from cell id) sized by radiusKm and opacity by reflectivityDbz; cyan for t ≤ 0, purple for t > 0, with a slow sinusoidal breathe (±4%) driven by time only. Satellite: a low-res offscreen field where each cell contributes a cold-top gaussian, tinted cyan, upscaled with smoothing. Heatmap: accumulate frame.flashDensity (or live flashes) into a 96×64 offscreen grid, draw upscaled in amber with alpha ramp. Wire layer toggles and the radar/satellite segmented control in the store. Measure draw time and log if over 4 ms.
```

### [x] 2.4 Lightning flash animation
**Does:** Live-style flash pops at observed and predicted flash points during playback.
**Depends on:** 2.3.
**Verify:**
- Flashes pop white-cyan for ~60ms then decay over ~400ms with a soft bloom; no jagged bolts.
- Flash count follows the scenario data; scenario B visibly intensifies; scenario A shows no flashes before +25 in the observed outcome layer.
- Global throttle: never more than 3 flash pops per second on screen; extra bursts merge into one brighter pop.
- Predicted flashes (t > 0) render as hollow purple rings that resolve to solid flashes only in outcome mode.
**Prompt:**
```text
Read docs/01-design-system.md (Lightning flash) and docs/03-motion-and-performance.md (Accessibility of motion). Implement src/lib/map/layers/lightning.ts with a ring buffer of ≤ 200 flashes. Spawn flashes from frame.lightning as timeMin crosses each flash's tMin (and sample at up to 2×–4× speed without spawning duplicates when scrubbing backwards). Render a radial bloom sprite: 60ms full, 400ms decay, white-cyan. Predicted flashes (t > 0) are hollow purple rings (no flash). Implement burst throttling (max 3 visible pops per second; merge extras into one brighter pop). Reduced motion: replace with a static dot for 1s. Add unit tests for the spawn/dedupe logic.
```

### [ ] 2.5 Risk corridors, path, motion vector, cell selection
**Does:** 15/30/60 min corridors with centre path, inner high-confidence corridor and outer uncertainty boundary; storm direction and speed; cell IDs and selection.
**Depends on:** 2.4, 1.4.
**Verify:**
- Purple corridors for 15/30/60 with centre line 2px, inner 16% fill, outer dashed 1px with 8% fill; horizon labels in mono at the ends.
- A motion arrow at each cell with speed in km/h.
- Cell IDs shown in mono; clicking selects (1px `fg` ring) and updates the store; clicking empty map deselects.
- Corridor geometry uses `corridorFor(cell, horizon, widthScale)`; changing the sensor mask in devtools widens the outer boundary with a 400ms tween.
**Prompt:**
```text
Read docs/01-design-system.md (Map look: Corridors, Selection) and docs/04-data-contract.md (widthScale, corridorFor). Implement layers/corridors.ts drawing, for the selected cell (and dimmed for others), the 15/30/60 min corridors from corridorFor(cell, horizon, widthScale(mask, health)) using a tweened scale so width changes animate over 400ms. Implement layers/motion.ts (arrow + speed label) and layers/labels.ts (cell IDs, selection ring). Wire pointer click hit-testing to store.selectCell. Expose a temporary dev-only button in the left rail to toggle a sensor so the widening can be seen; it will be replaced in 3.3.
```

### [ ] 2.6 Exposure asset layers
**Does:** Optional layers for population, schools, hospitals, airports, power lines, mines and outdoor events.
**Depends on:** 2.5, 1.2.
**Verify:**
- Each layer toggles independently from the Layers group; glyphs are 12px `fg-2` and turn `risk` amber when inside the selected 30-min outer corridor.
- Population layer renders as a soft low-alpha density field, not markers.
- Power lines render as thin polylines; segments inside a corridor turn amber.
- Toggling layers does not drop below 60 fps with all layers on.
- Every visible asset tooltip includes a `synthetic` chip.
**Prompt:**
```text
Read docs/01-design-system.md and docs/04-data-contract.md (Geo and assets). Implement layers/assets.ts drawing glyphs (draw simple vector glyphs on canvas: school, hospital, airplane, pylon, pick, ticket) pre-rendered into sprites; a population density field layer from village populations (gaussian splat into a low-res offscreen grid); transmission polylines. Highlight inside-corridor assets by point-in-polygon against the outer 30-min corridor. Add hover tooltips (name, type, population if relevant, `synthetic` chip) with pointer hit-testing on assets. Implement the Layers group UI in the left rail bound to the store.
```

### [ ] 2.7 Forecast decomposition
**Does:** "Forecast decomposition" toggle animating Motion, Growth or decay, and New initiation as three coloured layers.
**Depends on:** 2.5.
**Verify:**
- Toggle on: three layers appear over the forecast: Motion (purple vectors/streaks along the path), Growth or decay (amber where intensifying, cyan where weakening, sized by the decomposition weights), New initiation (a pulsing ring at each initiation site).
- Weights come from `cell.decomposition`; legend shows the three colours.
- Toggle off returns to the plain forecast; transitions 250ms.
- Scenario A shows an initiation site; scenario B shows strong growth; C shows widened motion uncertainty.
**Prompt:**
```text
Read docs/02-ui-spec.md (Left rail: View) and docs/04-data-contract.md (decomposition). Implement layers/decomposition.ts. Motion: a set of short directional streaks along the cell's motion vector across the 30-min corridor. Growth/decay: a filled disc at the forecast centroid, amber if growth weight > decay, else cyan, radius scaled by |growth|. New initiation: a slow expanding ring at each initiationSite, labelled "New cell" in mono. Fade the whole group in over 250ms when the toggle is on. Add the toggle and a three-colour legend to the left rail View group. When decomposition is on, dim the plain forecast blob to 40%.
```

---

# Phase 3 — Core panels

### [x] 3.1 Storm Time Machine dock
**Does:** Scrubber, playback controls, event markers.
**Depends on:** 2.1, 1.5.
**Verify:**
- Scrubber spans −60…+60 with 12 ticks; observed section cyan, forecast purple, NOW marker; timecode in mono.
- Dragging pauses playback and updates the map continuously; keyboard: Space play/pause, ←/→ step frame.
- Event markers (first flash, warning issued, outcome) appear on the track with tooltips.
- Speed control 1×/2×/4×; Replay button jumps to −60 and plays.
**Prompt:**
```text
Read docs/02-ui-spec.md (Bottom dock). Build src/components/shell/BottomDock.tsx with a custom Scrubber (pointer events, no library): track split at NOW into cyan and purple, tick per keyframe, draggable handle, event markers from scenario.events and store.issuedWarnings. Add play/pause, step, speed, Replay, mono timecode (e.g. "−24:00", "NOW", "+25:00") and a disabled placeholder Prediction/Actual toggle (enabled in 6.4). Hotkeys via src/hooks/useHotkeys.ts (Space, ←, →). Dragging sets store.timeMin and pauses. Use transform-based handle movement.
```

### [ ] 3.2 Selected cell panel and first-flash countdown
**Does:** The right rail's When / Where content: dial, probabilities, window, confidence, electrification stage and physical timers; active-storm variant.
**Depends on:** 3.1, 1.4, 0.2.
**Verify:**
- Selecting `C-A07` at t = 0 shows dial 71% at the 30-min horizon, 15/30/60 = 42/71/89, window 18–27 min, Moderate, `Flash data masked for this storm` chip.
- Horizon selector changes the dial arc; ring pulses only while probability is rising across recent frames.
- Also shows electrification stage, time since first appeared, cloud-top cooling rate, mixed-phase radar growth, expected first-flash region (name of nearest district/village).
- For electrified cells (Scenario B) the section switches to Active storm: flash rate, density trend, motion, intensifying/weakening tag.
- Empty state text matches `docs/07-content-and-copy.md`.
**Prompt:**
```text
Read docs/02-ui-spec.md (Right rail) and docs/01-design-system.md (Dial). Build src/components/panels/CellHeader.tsx and CountdownPanel.tsx using countdownFor(cell, mask) and frameAt for the selected cell. Compose the right rail sections in the fixed order When / Where / How sure / Exposure / Actions (Where, How sure and Exposure are stubs until 3.4 and 3.5). Add a horizon segmented control (15/30/60) driving the Dial. Rising = p30 higher than three keyframes earlier. Implement the Active storm variant for mode === "active". Use NumberTicker for percentages. Empty state per docs/07-content-and-copy.md.
```

### [ ] 3.3 Sensor Health Centre and Counterfactual Sensor Lab
**Does:** Sensor switches with live risk table, contribution sentence, health popover and banners; wires the mask through corridor, dial and dots.
**Depends on:** 3.2, 2.5.
**Verify:**
- Four switches (Radar, INSAT, Lightning network, NWP). Switching Radar off in A: risk animates 71 → 46, corridor widens, contribution sentence shows, top-bar radar dot turns red, banner appears with the exact text from the copy doc.
- Table shows all sensors / without radar / satellite / NWP / lightning network, current mask row highlighted.
- Any combination of switches yields valid numbers between floor and baseline; no NaN.
- Sensor health popover shows status and data age per feed for the current time; Scenario C shows radar offline from frame index 5 and lightning delayed.
- The dev-only sensor toggle from 2.5 is removed.
**Prompt:**
```text
Read docs/02-ui-spec.md (Left rail: Sensors; Sensor failure behaviour), docs/04-data-contract.md (sensor table, widthScale, contribution sentence) and docs/07-content-and-copy.md. Build src/components/panels/SensorLab.tsx and SensorHealth.tsx, plus SensorBanner in the shell. Effective sensor state = user toggle OR scenario-scripted outage at the current time. Everything derives from that one effective mask: riskFor, widthScale, countdownFor, contributionFor, top-bar StatusDots, banner text, corridor tween, dial arc. Show data age chips in mono. Remove the dev toggle. Add tests that cover all 16 masks for scenario A and B.
```

### [ ] 3.4 Physical evidence panel
**Does:** "Why did risk increase?" list with small trend charts per variable.
**Depends on:** 3.2.
**Verify:**
- Rows use only allowed variables; each has an arrow (↑ → ↓ as icons), a plain delta ("Echo top +2.1 km"), and a Sparkline with a marker at the current time.
- Rows update as time changes (sparkline marker moves, delta recalculates from the sparkline).
- With radar off, ZDR/KDP/mixed-phase rows render greyed with "Radar unavailable" and stay legible.
- No generic phrasing appears anywhere.
**Prompt:**
```text
Read docs/02-ui-spec.md (Right rail: How sure and why) and docs/07-content-and-copy.md (Evidence rows). Build src/components/panels/EvidencePanel.tsx using cell.evidence and evidence.ts derive helpers. Sparkline marker follows timeMin. Rows dependent on radar (ZDR column, KDP core, mixed-phase growth, echo top) grey out with an inline "Radar unavailable" note when radar is effectively off; satellite rows (cloud-top cooling) grey when INSAT is off; flash rate when lightning network is off; CAPE when NWP is off. Include the confidence chip and the corridor width in km beside the panel header.
```

### [ ] 3.5 Exposure panel
**Does:** "Potentially affected region" summary for the selected corridor with estimated arrival.
**Depends on:** 3.2, 2.6.
**Verify:**
- Scenario B at t = 0 shows 3 villages, 2 schools, 1 transmission corridor, arrival 24 min, each with a `synthetic` chip.
- Only asset types with the layer enabled contribute to the highlighted map icons, but the panel always lists counts for all types present.
- Horizon selector changes counts consistently (15 ⊂ 30 ⊂ 60).
- Names in the list are clickable and pan/pulse the map to the asset.
**Prompt:**
```text
Read docs/02-ui-spec.md (Right rail: Exposure). Build src/components/panels/ExposurePanel.tsx from exposureFor(corridor, assets) at the selected horizon. Show counts with icons, top 3 named items each, estimated arrival (mono), and a synthetic chip on the header. Clicking an item triggers a one-time pulse on the map layer at that asset (store field `highlight`). Ensure 15 ⊂ 30 ⊂ 60 in tests.
```

### [ ] 3.6 Scenario switcher and scenario stories
**Does:** Scenario list with cross-fade, resets and per-scenario framing.
**Depends on:** 3.3.
**Verify:**
- Selecting A/B/C swaps data, refits the map with a 400ms tween, resets time to −60, clears selection and warnings, cross-fades layers.
- Each list item shows name and one-line story; active item marked.
- C's radar banner appears exactly at frame index 5's time and disappears when scrubbing back.
- Full-flow smoke test passes: pick A → play → select cell → sensor off → scrub without console errors.
**Prompt:**
```text
Read docs/02-ui-spec.md (Left rail: Scenarios). Build src/components/panels/ScenarioList.tsx and wire store.selectScenario with a 300ms cross-fade of the map layers (draw old and new frameState with alpha) and the map refit tween. Add a Playwright-free smoke test as a Vitest test on the store: selectScenario resets state; effective mask for C at t = −10 has radar off. Put a short "scenario story" line under the scenario clock in the top bar.
```

---

# Phase 4 — Alerts

### [ ] 4.1 Alert composer sheet and multilingual text
**Does:** The Create warning flow: polygon/horizon choice, editable place and time window, EN / HI / OD tabs.
**Depends on:** 3.2, 3.6.
**Verify:**
- `Create warning` opens a right-side sheet pre-filled from the selected cell: place (nearest district/village), window from the countdown, polygon = 30-min inner corridor (highlighted on the map).
- The three languages render with correct glyphs (Noto Sans Devanagari and Oriya loaded only when the sheet opens).
- Text equals the template in `docs/07-content-and-copy.md` filled from JSON; no number typed by hand.
- Footer tag reads "Text composed from verified forecast fields. LLM-verbalised (pre-generated)."
- `Issue warning` adds a timeline marker, shows a toast "Warning issued for {place}", closes the sheet.
**Prompt:**
```text
Read docs/02-ui-spec.md (Alert composer) and docs/07-content-and-copy.md. Build src/components/alerts/AlertComposer.tsx using shadcn Sheet, src/lib/i18n/alertTemplates.ts (pure functions filling templates from {place,start,end}) and src/data/content/alerts.json holding the three templates. Load @fontsource/noto-sans-devanagari and @fontsource/noto-sans-oriya via dynamic import when the sheet first opens (add those two packages and note it in docs/09-decisions.md). Times formatted from scenario t0 plus window minutes (IST, 12-hour, mono). Highlight the selected polygon on the map with a warning-amber outline while the sheet is open. Issue action appends to store.issuedWarnings.
```

### [ ] 4.2 SMS and mobile notification previews
**Does:** SMS bubble with segment counter and lock-screen notification preview.
**Depends on:** 4.1.
**Verify:**
- SMS preview shows the selected language's text, sender "ElectroCast-X demo", character count vs 160 (or Unicode segments of 70 for HI/OD).
- Notification preview looks like a phone lock screen: wordmark glyph, "Lightning warning", two-line body, "now".
- Previews update instantly when language or place/time changes.
- No use of "IMD" or an official sender name.
**Prompt:**
```text
Read docs/07-content-and-copy.md (SMS preview, Notification preview). Build src/components/alerts/SmsPreview.tsx and PhonePreview.tsx as pure presentational components fed by the composed alert text. Phone frame is a simple flat outline (no device mockup images). Compute SMS segments: GSM-7 160 for English (single segment), UCS-2 70 per segment for Devanagari/Oriya; show "n characters · m segment(s)" as a mono line. Animate the notification sliding in from the top of the phone frame once when the preview tab opens (250ms).
```

### [ ] 4.3 CAP 1.2 JSON preview
**Does:** Valid-shaped CAP 1.2 alert preview with syntax highlighting and copy.
**Depends on:** 4.1.
**Verify:**
- JSON follows the field list in `docs/07-content-and-copy.md`; `status` is `Exercise`; includes the "Simulated exercise" note.
- Identifier is deterministic from scenario, cell and time; `polygon` is closed `lat,lon` pairs from the selected corridor.
- `urgency` and `certainty` follow the mappings in the doc.
- Copy button copies the JSON and confirms with the toast; highlighter is tiny (hand-rolled regex, no library).
- A unit test builds CAP for A and B and checks required CAP 1.2 elements.
**Prompt:**
```text
Read docs/07-content-and-copy.md (CAP 1.2 preview). Implement src/lib/i18n/cap.ts (buildCap(scenario, cell, horizon, place, issuedAtMin) → object; deterministic identifier; polygon closed and in lat,lon order; urgency/certainty mappings) with tests, and src/components/alerts/CapPreview.tsx with a hand-rolled JSON highlighter using tokens (keys fg-2, strings observed-tinted, numbers risk). Add copy-to-clipboard with a toast. Finish the composer tab set: English, हिन्दी, ଓଡ଼ିଆ text plus SMS, Phone, CAP.
```

---

# Phase 5 — Storm X-ray

### [ ] 5.1 Procedural voxel volume and lazy R3F scene
**Does:** Generates a small reflectivity volume from cell fields and renders it in a lazily loaded R3F scene.
**Depends on:** 3.2.
**Verify:**
- Opening X-ray loads a separate chunk (visible in Network); initial Mission Control bundle unchanged.
- `buildVolume(cell)` returns a 24×24×16 float grid deterministically (seeded) from `echoTopKm`, `reflectivityDbz`, `updraftMs`; unit-tested (same input → same output, max near the updraft core).
- Scene shows an instanced point/voxel cloud with orbit rotation, limited zoom, dark background, and no console errors; disposes cleanly on close.
- Opens in under 1 second on the demo laptop.
**Prompt:**
```text
Read docs/02-ui-spec.md (X-ray) and docs/04-data-contract.md (procedural volume) and docs/03-motion-and-performance.md (bundle budgets). Implement src/lib/derive/volume.ts (buildVolume: sum of seeded gaussians shaped by echoTopKm/reflectivity/updraft, 24×24×16, Float32Array; tests). Build src/components/xray/XRaySheet.tsx (lazy via next/dynamic ssr:false) and StormScene.tsx using @react-three/fiber and drei OrbitControls (limit polar angle and distance). Render volume as an InstancedMesh of small cubes coloured by reflectivity on a cyan opacity ramp (observed) — thresholded to keep under ~3000 instances. frameloop="demand" with invalidate on control changes and a slow idle auto-rotate that stops on interaction. Dispose geometries/materials on unmount.
```

### [ ] 5.2 Temperature layers and altitude slider
**Does:** 0 °C, −10 °C, −20 °C planes, vertical altitude slider with labelled bands, slice readout.
**Depends on:** 5.1.
**Verify:**
- Translucent horizontal planes at heights derived from `freezingLevelKm` and a lapse rate; labelled in mono in the scene.
- Left-edge vertical slider with exactly the three labelled bands from the spec; dragging moves a slice plane and highlights voxels near it.
- Readout card shows reflectivity, ZDR, KDP at the slice altitude; values are derived from the same cell fields.
- Slider is keyboard operable.
**Prompt:**
```text
Read docs/02-ui-spec.md (X-ray). Add src/components/xray/AltitudeSlider.tsx (vertical, custom, labelled bands: "0 °C freezing level", "−10 °C strong mixed-phase region", "−20 °C ice-charge separation") and temperature planes in StormScene (height = freezingLevelKm + k·lapse for −10 °C and −20 °C; lapse 6.5 K/km). Slice plane follows the slider; voxels within ±0.4 km brighten. Slice readout via derive helpers (reflectivity from the volume; ZDR and KDP from cell fields with smooth altitude profiles). Keep DOM labels via drei Html sparingly (≤ 5).
```

### [ ] 5.3 ZDR column, KDP core, updraft, graupel, flashes
**Does:** Parametric physical features and flashes inside the twin, each toggleable.
**Depends on:** 5.2.
**Verify:**
- Toggles: Reflectivity volume, ZDR column, KDP core, Updraft, Graupel and mixed-phase region, Flashes.
- ZDR column is a translucent cylinder from the freezing level up to the level in `cell.zdrColumnLevel` (reaches −10 °C in A at t = 0); KDP core is a blob near the mixed-phase layer sized by `kdpCore`; updraft shown as rising streamlines scaled by `updraftMs`.
- Graupel/mixed-phase region highlights voxels between −10 and −20 °C with high reflectivity.
- Existing flashes (solid) and predicted flashes (hollow rings) are placed by `altKm` in the volume.
- Each feature uses the semantic colours (observed cyan, forecast purple, risk amber for the mixed-phase hazard).
**Prompt:**
```text
Read docs/01-design-system.md (colour meaning) and docs/02-ui-spec.md (X-ray toggles). Add to StormScene: a ZDR column cylinder (from freezing level to the level in cell.zdrColumnLevel), a KDP core (icosphere near −10 °C sized by kdpCore), updraft streamlines (a few animated line particles, rate by updraftMs, animated with a single useFrame that only runs when the toggle is on), graupel/mixed-phase highlight (recolour voxels between −10 and −20 °C above a reflectivity threshold in amber), and flashes from frame.lightning inside the cell (solid) plus predicted (hollow). Build XRayControls.tsx with the six toggles. Keep instance counts and draw calls small.
```

### [ ] 5.4 Sync with time and sensor mask; polish
**Does:** X-ray reflects the current frame and degrades when sensors are off.
**Depends on:** 5.3, 3.3.
**Verify:**
- Scrubbing time while X-ray is open updates the twin (echo top grows in A; ZDR column climbs to −10 °C).
- Turning Radar off dims/fragments ZDR, KDP and volume layers and shows an inline "Radar unavailable" label; other sensors' effects are correct (INSAT off hides cloud-top overlay only).
- Open/close animation 250ms; ESC closes; focus returns to the trigger.
- Toggling rapidly does not leak memory (check with performance monitor).
**Prompt:**
```text
Read docs/04-data-contract.md and docs/02-ui-spec.md (X-ray). Subscribe the X-ray to timeMin, selectedCellId and the effective sensor mask. Rebuild the volume only when the interpolated cell changes materially (threshold), otherwise update uniforms. When radar is effectively off, apply a degrade factor (opacity, noise dropout) to reflectivity, ZDR and KDP layers and show "Radar unavailable" in the sheet. Add ESC handling and focus restoration. Verify no geometry or material leaks across ten open/close cycles.
```

---

# Phase 6 — Product surface

### [ ] 6.1 Landing page with live hero
**Does:** The front door: live map loop hero and three question sections.
**Depends on:** 2.7, 3.2 (for the mini dial), 0.2.
**Verify:**
- First paint shows the live map engine looping a scenario at 60% brightness behind the headline; no stats row, no gradient orb.
- One orchestrated load sequence, then only the storm moves.
- Below the fold: When / Where / How sure sections each with a live mini-view (dial, corridor widening, sensor mask), not screenshots.
- "Open Mission Control" navigates; landing first-load JS ≤ 120 KB gzip.
- Caption "Simulated demo scenario over Odisha" present.
**Prompt:**
```text
Read docs/01-design-system.md (Landing page) and docs/07-content-and-copy.md. Build src/app/page.tsx, src/components/landing/Hero.tsx and HeroMapLoop.tsx (reuse the map engine with a fixed looping scenario A, no interaction, non-blocking, paused when off-screen) and QuestionSections.tsx (three sections with live mini-views reusing Dial, corridor drawing on a tiny canvas, and a four-dot sensor row). Use blur-fade and text-reveal only for the initial load sequence, then nothing. Headline and sub exactly as in the design doc; single primary button and a text link to /how-it-works. Check bundle size with next build output and fix if over budget.
```

### [ ] 6.2 How it works: pipeline view
**Does:** The technical flow diagram with animated beams and the currently active stage lit.
**Depends on:** 0.2.
**Verify:**
- Diagram matches the PDF's flow: four sources → quality control and alignment → common grid with masks → temperature-coordinate features → temporal transformer + neural advection → two heads → conformal calibration → corridors, evidence, alerts.
- An animated beam runs along the flow once per 6s (single orchestrated loop, pauses when hidden). Hovering a stage shows a two-line explanation and the UI panel where it appears in Mission Control (link).
- Optionally opened as a sheet from Mission Control with the active stage lit for the current context (e.g. sensor lab open → "Masks" stage).
**Prompt:**
```text
Read docs/07-content-and-copy.md (Pipeline page copy) and docs/08-ps-traceability.md. Build src/app/how-it-works/page.tsx and src/components/pipeline/PipelineDiagram.tsx as SVG laid out left to right with Magic UI animated-beam adapted to our tokens. Content in src/data/content/pipeline.json (stage id, title, one-line explanation, linked Mission Control feature). Colour: sources cyan, model stages purple, outputs amber. Hover/focus shows the explanation and a "See it in Mission Control" link. Add a compact variant used in a sheet from the Mission Control top bar highlighting a stage passed as a prop.
```

### [ ] 6.3 Validation page (illustrative)
**Does:** Reliability diagram and POD/FAR/CSI/Brier vs lead time, clearly placeholder.
**Depends on:** 0.2.
**Verify:**
- ECharts is imported via `echarts/core` with only the used components, loaded lazily; route chunk is separate.
- Reliability diagram hugs the diagonal; skill curves decline gently with lead time; every chart and number shows `illustrative placeholder`.
- The page states "These values are not results."
- Chart theme uses our tokens (no default ECharts palette).
**Prompt:**
```text
Read docs/07-content-and-copy.md (Validation page copy). Build src/app/validation/page.tsx and src/components/validation/{ReliabilityChart,SkillChart}.tsx using echarts/core with LineChart, BarChart (only if used), GridComponent, TooltipComponent, LegendComponent, CanvasRenderer, registered lazily inside a dynamic import. Data from src/data/content/validation-placeholder.json (clearly marked). Theme via a custom ECharts theme object built from our tokens. Include a small table of POD/FAR/CSI/Brier at 15/30/60 min. Tag everything `illustrative placeholder`. Ensure the chunk is not in Mission Control's bundle.
```

### [ ] 6.4 Prediction vs Actual compare mode
**Does:** Single-map swipe divider comparing prediction with observed outcome.
**Depends on:** 3.1, 2.5, 1.3.
**Verify:**
- Toggling in the dock shows a draggable vertical divider on the map: left = predicted (corridors, predicted flashes as rings, predicted path), right = observed (actual flashes solid, observed path).
- Works at any time position; at +25 in Scenario A the observed first flash lies inside the predicted region and the panel shows "First flash observed at +25 min, inside the 18–27 min window".
- Divider is keyboard operable; no second map instance is created.
- Labels "Prediction" and "Actual" in the map corners.
**Prompt:**
```text
Read docs/02-ui-spec.md (Prediction vs Actual) and docs/04-data-contract.md (outcome). Implement compare mode in the map engine using canvas clipping: draw prediction layers clipped to x < split and outcome layers (observedFlashes, observedPath, observed cells) clipped to x ≥ split; draw a 1px divider with a grabbable handle; enable the dock toggle from 3.1. Add an outcome summary line to the right rail (computed from outcome and firstFlash window; wording per copy doc) shown only in compare mode. Handle pointer and keyboard for the divider.
```

### [ ] 6.5 Guided demo mode
**Does:** Auto-plays the recommended demo flow with captions and a Stop control.
**Depends on:** 4.3, 5.4, 6.4, 3.6.
**Verify:**
- "Guided demo" runs the nine steps of `docs/06-demo-script.md` automatically: scenario A, play, select cell, decomposition, X-ray to −10 °C, radar off, alert composer, issue warning, compare at +25.
- A caption toast (one sentence) appears at the bottom of the map for each step.
- Stop/Esc halts and leaves state consistent; Restart works; running twice in a row works.
- Steps are data-driven (`src/data/content/guide.json`) and use store actions only.
**Prompt:**
```text
Read docs/06-demo-script.md. Implement src/lib/guide.ts (a typed list of steps: caption, durationMs, action(store)) driven by a runner that awaits each step and can be cancelled, plus src/components/shell/GuideCaption.tsx (caption toast, Stop button, step count in mono) and wire the top-bar "Guided demo" button. Steps must use store actions only, never DOM clicks. Ensure the runner restores a clean state on stop and before start. Store the captions in src/data/content/guide.json.
```

---

# Phase 7 — Polish and ship

### [ ] 7.1 Motion pass and performance audit
**Does:** Applies the motion vocabulary consistently and meets all budgets.
**Depends on:** 6.5.
**Verify:**
- All transitions use `--ease-instrument` and the three durations; no bounce, no spring overshoot anywhere.
- Bundle: landing ≤ 120 KB gzip, Mission Control ≤ 220 KB gzip, X-ray and validation lazy.
- Chrome Performance: 60 fps at 1080p during playback with layers on; no long task over 50 ms; paused CPU near idle.
- No Tailwind `transition-*` on Motion-animated elements.
**Prompt:**
```text
Read docs/03-motion-and-performance.md fully. Audit the app against it: grep for spring/bounce, transition-* on motion elements, any import of full `motion`, barrel icon imports. Run next build and report route sizes; fix anything over budget (dynamic imports, tree-shaking, removing unused shadcn parts). Profile playback in Chrome with all layers on and fix hot spots (sprite reuse, offscreen caching, avoiding per-frame allocations, throttling). Write the measured numbers into docs/10-qa-checklist.md.
```

### [ ] 7.2 Accessibility and keyboard
**Does:** Keyboard operation, focus, reduced motion, contrast.
**Depends on:** 7.1.
**Verify:**
- Every interactive element reachable by keyboard; focus ring visible; hotkeys documented in a `?` shortcut sheet.
- `prefers-reduced-motion`: no drift, pulse, widening tween or flash bursts; state still readable.
- Contrast ≥ 4.5:1 for all informative text (adjust `fg-3` usage).
- Map has an accessible summary (aria-label + visually hidden text describing selected cell, risk and horizon).
**Prompt:**
```text
Read docs/10-qa-checklist.md (Accessibility). Audit keyboard and screen-reader behaviour across shell, panels, composer, X-ray and compare divider. Add a "?" shortcut sheet (Space, ←/→, [ ], G guided, X X-ray, W warning). Add an aria-live region announcing risk changes when sensors toggle (throttled). Verify reduced motion path in every animated component. Compute contrast for all text/background token pairs with a small script and fix violations by changing usage, not the semantic colours.
```

### [ ] 7.3 Offline, projector and environment hardening
**Does:** Proves the demo works with no network at projector resolution.
**Depends on:** 7.2.
**Verify:**
- `npm run build && npm run serve` works with Wi-Fi off; hard reload works; DevTools Network shows zero external requests.
- Looks correct at 1280×720 and 1920×1080 and on a projector-like low-contrast simulation (increase brightness) — `fg-2` remains readable.
- Full-screen and window resize are stable; no layout shift.
- A `docs/10-qa-checklist.md` run is completed and ticked.
**Prompt:**
```text
Run the static export and serve it with Wi-Fi off. Fix any external requests (fonts, images, analytics). Test 1280×720, 1920×1080 and a browser zoom of 125%; fix overflow and clipping. Check first-paint (map visible before any panel content). Run the full QA checklist in docs/10-qa-checklist.md and tick or file each item as a fix. Add a `public/404.html` if the export needs it.
```

### [ ] 7.4 Rehearsal assets and README
**Does:** Recorded fallback video, final README and demo notes.
**Depends on:** 7.3.
**Verify:**
- `public/media/demo.webm` (under 15 MB, 60–90 s) recorded from Guided demo at 1080p.
- README lists run commands, demo flow, keyboard shortcuts and the honest-labelling statement.
- A fresh clone → `npm install` → `npm run verify` → `npm run serve` works.
- The 3-minute live flow completed by someone who has not seen it before, unaided.
**Prompt:**
```text
Finalise the README (run, verify, structure, demo flow, shortcuts, honest labelling). Add a script scripts/record-demo.md describing how to record the Guided demo to public/media/demo.webm (screen recorder at 1080p, 60–90 s) — do not add recording dependencies. Do a fresh-clone dry run (git clone into a temp dir, npm install, npm run verify, npm run serve) and report any failures. Update docs/06-demo-script.md with any timing changes discovered.
```

---

## Definition of done (whole project)

- [ ] Every chunk above ticked; `npm run verify` passes on a fresh clone.
- [ ] `docs/08-ps-traceability.md`: every row visible in the running app.
- [ ] `docs/10-qa-checklist.md`: every item ticked with measured performance numbers filled in.
- [ ] Hindi and Odia alert text reviewed by a native speaker.
- [ ] A person who has never seen it completes the demo flow in under 3 minutes.
