# 02 — UI spec

## Routes
| Route | Purpose |
|---|---|
| `/` | Landing (product front door) |
| `/mission-control` | The product |
| `/how-it-works` | Pipeline diagram with active stage lit |
| `/validation` | Illustrative reliability and skill metrics |

## Mission Control layout (1920×1080 reference, min 1280×720)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ElectroCast-X  [SIMULATED]  Scenario name   IST 16:02  ● ● ● ●   Guide    │ 48px
├───────────┬───────────────────────────────────────────────┬───────────────┤
│ Scenarios │                                               │ Cell C-A07    │
│ ───────── │                                               │ Countdown dial│
│ Layers    │              CANVAS MAP (full bleed)          │ Evidence      │
│ ───────── │                                               │ Exposure      │
│ Sensors   │                                               │ [Create warn.]│
│ ───────── │                                               │ [Open X-ray]  │
│ View      │                                               │               │
├───────────┴───────────────────────────────────────────────┴───────────────┤
│ ◀ ▶ Replay   −60 ──●── NOW ─────── +15 ── +30 ── +60      Prediction/Actual│ 96px
└───────────────────────────────────────────────────────────────────────────┘
```
- Left rail 264px, right rail 336px, both collapsible. Map resizes, never overlays. Top bar 48px. Bottom dock 96px.
- Below 1280px wide: rails become sheets opened from top-bar buttons. The demo is designed for projector at 1280+; mobile is out of scope but must not break.

## Top bar
Wordmark; `SIMULATED` chip with tooltip "All data in this scenario is prepared. No live feeds."; scenario name; clock (IST, with UTC in tooltip); four sensor dots (Radar, INSAT, Lightning network, NWP) that open the Sensor Health popover; "Guided demo" button.

## Left rail
1. **Scenarios:** A, B, C as a vertical list with one-line story each. Selecting one resets time to the scenario's start and cross-fades the map.
2. **Layers:** Radar, Satellite, Flash density, Risk corridors, Districts and villages; exposure group: Population, Schools, Hospitals, Airports, Power lines, Mines, Outdoor events. Radar and Satellite are mutually exclusive (segmented control); the rest are switches.
3. **Sensors (Counterfactual Sensor Lab):** four switches with data-age chips. Under them, the live risk table (all sensors, without radar, without satellite, without NWP, without lightning network) with the selected mask highlighted, plus the one-sentence contribution explanation.
4. **View:** Forecast decomposition toggle (Motion, Growth or decay, New initiation); legend for the three colours.

## Right rail (selected cell)
Order is fixed and answers the three questions top to bottom.
1. **Header:** cell ID (mono), electrification stage chip, `flash data masked for this storm` chip in first-flash mode (data-leakage exclusion).
2. **When:** first-flash dial; table 15/30/60 min probabilities; estimated window; confidence chip; time since cell first appeared; cloud-top cooling rate; mixed-phase radar growth; expected first-flash region.
   - For an already electrified cell, this section becomes **Active storm**: flash rate, density trend, motion vector, intensifying or weakening tag.
3. **Where:** corridor summary (arrival estimate, speed, direction); decomposition legend if on.
4. **How sure, and why:** confidence chip and corridor width in km; Physical evidence list "Why did risk increase?" each row with variable, direction arrow, delta and sparkline.
5. **Exposure:** "Potentially affected region" (villages, schools, transmission corridor, estimated arrival), tagged `synthetic`.
6. **Actions:** `Create warning` (primary), `Open storm X-ray` (secondary).
With no cell selected, the rail shows a scenario summary and the instruction "Select a storm cell on the map."

## Bottom dock: Storm Time Machine
- Scrubber spanning −60 to +60 min, 12 keyframes as ticks. Observed section cyan, forecast section purple, NOW marker `fg`.
- Event markers on the track: first flash, warning issued, observed outcome.
- Controls: play/pause, step ±1 frame, speed (1×, 2×, 4×), Replay.
- **Prediction vs Actual** toggle: a vertical swipe divider on the single map; left shows prediction, right shows what happened.
- Timecode in mono at the left of the scrubber.

## X-ray (modal sheet over the map area)
Opens from the right rail. Full map region minus rails.
- 3D storm digital twin (React Three Fiber), orbit rotation, limited zoom.
- Vertical altitude/temperature slider on the left edge with labelled bands: `0 °C freezing level`, `−10 °C strong mixed-phase region`, `−20 °C ice-charge separation`. Moving it scrubs a horizontal slice plane.
- Toggles: Reflectivity volume, ZDR column, KDP core, Updraft, Graupel and mixed-phase region, Flashes (existing and predicted).
- Readout card follows the slice: reflectivity, ZDR, KDP at that altitude.
- Reads frame and sensor mask from the store; disabling Radar visibly degrades ZDR/KDP layers.

## Alert composer (sheet from the right)
1. Polygon selection: default to the cell's 30-min inner corridor; user can choose 15/30/60.
2. Editable fields limited to place name and time window (pre-filled from data).
3. Tabs: English, हिन्दी, ଓଡ଼ିଆ. Each shows the alert text.
4. Previews: SMS (160-char count), mobile notification (lock-screen style), CAP 1.2 JSON (syntax highlighted, copy button).
5. Footer tag: `Text composed from verified forecast fields. LLM-verbalised (pre-generated).`
6. `Issue warning` writes a marker on the timeline at the current time and closes.

## Sensor failure behaviour (Scenario C, and any sensor toggled off)
- Top-bar dot turns red (offline) or amber (delayed).
- A slim banner under the top bar: "Radar unavailable. Forecast continues using satellite, lightning and NWP data. Uncertainty has increased."
- Corridor widens with `--duration-slow`; confidence chip drops to Low or Moderate; dial arc animates to the new value.

## Empty, error, loading
- No loading spinners anywhere: all data is local. First paint must show the map.
- Empty states name the next action ("Select a storm cell on the map.").
- Unknown routes show a plain 404 with a link to Mission Control.
