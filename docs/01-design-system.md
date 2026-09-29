# 01 — Design system: "Forecaster's Instrument"

A calm, precise instrument for a duty forecaster. The drama comes from the storm data, not the chrome.

## Principles
1. **The map is the product.** It fills the viewport. Everything else is a slim, flat, docked rail.
2. **Colour is data.** Chrome is neutral. Colour only ever encodes meaning.
3. **One memorable thing.** The **first-flash countdown dial** (see below) is the signature element. Everything around it stays quiet.
4. **Structure is information.** Borders, dividers and labels exist because they group or rank content, never as decoration.
5. **Honesty is visible.** Synthetic and illustrative tags are part of the language and look deliberate.

## Colour

Surfaces are a deep storm-slate with a blue undertone (a radar room at night), deliberately not neutral grey-black.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#070b12` | Map background, page |
| `rail` | `#0b111a` | Docked rails and dock |
| `raised` | `#111a26` | Inputs, hover, selected row |
| `line` | `#1a2534` | Hairline dividers (1px) |
| `line-strong` | `#27354a` | Focused/active borders |
| `fg` | `#e9e7e2` | Primary text (warm off-white) |
| `fg-2` | `#98a3b3` | Secondary text |
| `fg-3` | `#5c6879` | Tertiary, disabled, axis labels |
| `observed` | `#4fd8eb` | Cyan: measured, current, online |
| `forecast` | `#9e86ff` | Purple: model output, forecast |
| `risk` | `#ffb020` | Amber: risk, countdown, warnings, delayed |
| `alert` | `#ff5a52` | Red: sensor failure, severe warning only |

Rules
- Semantic mapping is fixed: **observed = cyan, forecast = purple, risk = amber, failure = red.** Sensor status dots: online = cyan, delayed = amber, offline = red. There is no green in the product.
- Fills of meaning colours use opacity steps (8%, 16%, 30%) of the same hue. No gradients between different hues.
- Panels have **no shadows, no glow, no blur, no gradient washes**. The only glow permitted is the lightning flash itself, on the canvas.
- Risk ramp on the map (low to high): transparent → amber 20% → amber 55% → amber 90%. Severe uses red only above the warning threshold defined in the data contract.

## Typography
- **Instrument Sans** (variable): all UI text and headlines. Loaded via `@fontsource-variable/instrument-sans`.
- **IBM Plex Mono**: numbers, IDs, timestamps, coordinates, probabilities only. Never for prose or labels. Loaded via `@fontsource/ibm-plex-mono` (400, 500).
- All numbers use `.num` (tabular figures).
- Scale (px / line-height): 11/16 caption, 12/16 label, 13/20 body-sm, 14/20 body, 16/24 lead, 20/28 title, 32/36 display, 56/56 hero. Weights: 400 body, 500 emphasis, 600 headlines only.
- **Labels are sentence case**, 12px, `fg-2`. No tracked ALL-CAPS labels, no eyebrow above every heading. Uppercase is allowed only for the two-letter language codes (EN, HI, OD) and the `SIMULATED` chip.
- Line length under 72 characters for prose.

## Shape and spacing
- Spacing on a 4px grid. Rail padding 16px. Row height 32px (dense), 40px (touch).
- Radii are **deliberately different by role**: rails and dock 0, inputs and buttons 6, chips full pill, the dial is a circle. There is no single "card radius".
- Rails are separated from the map by a 1px `line`, not by cards or gaps.
- Icons: Lucide, 16px, 1.5 stroke, `fg-2` unless active.

## The signature element: first-flash dial
- A 168px ring. Outer track `line-strong`. Three tick marks at 15 / 30 / 60 minutes, labelled in mono.
- Filled arc in `risk` shows probability at the selected horizon. The estimated first-flash window is a thicker arc segment.
- Centre: large mono percentage, small sentence-case caption ("chance of first flash within 30 min").
- The ring pulses softly (opacity 0.85 to 1, 2.4s, ease-in-out) only while probability is rising between frames. It is the only ambient pulse in the UI.
- When the sensor mask changes, the arc animates to the new value with `--duration-slow`.

## Components (build on shadcn/ui, restyled to these tokens)
- Base: shadcn/ui primitives (Button, Switch, Tabs, Tooltip, Dialog, Sheet, Slider, ScrollArea, Toggle). Restyle to tokens. Remove default shadows and large radii.
- Custom: `Panel` (flat, titled, collapsible), `Stat` (label + mono value + delta), `Chip`, `StatusDot`, `Sparkline` (hand-rolled SVG), `NumberTicker`, `Dial`, `Scrubber`.
- Magic UI, copy-paste only these: `number-ticker`, `animated-beam` (pipeline page), `blur-fade` (landing), `text-reveal` (landing), `border-beam` (only on the active warning card). No others.
- Do not use Aceternity UI or any 3D card, spotlight, aurora or particle-background component.

## Map look (canvas)
- Base: `bg` fill, district boundaries `line-strong` at 1px, state outline `fg-3`. Labels in Instrument Sans 11px `fg-3`. A faint 0.5° graticule.
- Radar: cell blobs rendered as soft blobs in cyan for observed, coloured by reflectivity intensity (opacity), not by rainbow. Forecast blobs in purple.
- Satellite mode: monochrome cloud-top temperature ramp (cooler = brighter) tinted cyan.
- Flash density heatmap: amber.
- Lightning flash: 60ms white-cyan pop at full opacity, 400ms decay, thin bolt-less point with a soft radial bloom. Never draw jagged bolt art.
- Corridors: centre path line 2px; inner corridor 16% fill; outer uncertainty boundary dashed 1px, 8% fill. Purple. Widening animates.
- Selection: 1px `fg` ring plus cell ID label in mono.
- Assets: 12px glyphs, `fg-2`, turning `risk` when inside a corridor.

### Storm cell station glyph
- The storm-cell station glyph adapts the WMO synoptic station model to ElectroCast-X fields. It is drawn directly on the map canvas at 1× scale; canvas device-pixel ratio remains capped at 2.
- The centre circle has a 9px radius and 1.5px stroke. Its stroke is `observed` for an `obs` frame at or before t=0 and `forecast` for a `forecast` frame after t=0; this is the only glyph stroke that encodes time type.
- Its face is a sky-cover-style pie: it starts at 12 o’clock, sweeps clockwise through `(headlineRisk / 100) × 360°`, and fills in opaque `risk`. The remaining wedge is opaque `bg`, never transparent. At 0% the glyph is hollow except for its ring; at 100% it is a solid `risk` disc.
- A motion barb starts at the circle edge and extends 22px at `cell.motion.dirDeg` (north is 0°, increasing clockwise), using the same stroke as the ring. It has one 8px tick per 10 km/h and a 4px half tick for a rounded remainder of at least 5 km/h. Ticks sit on one clockwise side, angle back 60° from the shaft, and are spaced 5px apart moving outward. Speeds are rounded to the nearest 5 km/h before marks are calculated. At 60 km/h and above, one filled 10px-base pennant replaces the first 50 km/h and the remaining sub-50 km/h speed supplies the ticks.
- Mono, tabular 10px numerals use the same colour as the ring: upper left at (-14px, -10px) is `echoTopKm` to one decimal plus `km`; lower left at (-14px, +14px) is `flashRate` to one decimal plus `/min` for active cells, otherwise headline risk plus `%`; right at (+14px, 0) is the cell ID. The glyph never uses a lightning-bolt icon.
- Selection adds only an outer 13px-radius, 1px `fg` ring with no fill. Hover changes only the cursor to a pointer.
- The full glyph renders for a selected or hovered cell, or when the frame has three or fewer cells. In denser frames, unfocused cells retain only the ring and pie face. The fixed 13px outer-ring radius is also the click and hover target in either level of detail.

## Landing page
- Hero opens with the live product: the real map engine running a looping storm over Odisha at full bleed, dimmed to 60%.
- Headline (sentence case, left aligned, max 14ch per line at hero size): "Lightning warnings that start before the first flash."
- Sub (one sentence): "ElectroCast-X forecasts when a developing cloud will first produce lightning, where an active storm will go, and how far to trust it, 15, 30 and 60 minutes ahead."
- One primary button: "Open Mission Control". One text link: "How it works".
- No stats row, no logo strip, no testimonial, no gradient orb. A single small caption anchors it: "Simulated demo scenario over Odisha".
- One orchestrated load sequence (map fades up, headline reveals line by line, dial draws in at bottom-right). After that, only the storm moves.
- Below the fold: three short sections, one per question (When / Where / How sure), each with a live mini-view, not a screenshot.

## Do not
Generic dashboard cards; identical rounded tiles; glassmorphism; neon glow on panels; rainbow radar ramps; cream/terracotta or acid-green accents; emojis; stock illustrations; bounce or spring overshoot; fade-and-slide-up on every section.
