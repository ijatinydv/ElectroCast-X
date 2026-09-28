# 07 — Content and copy

## Voice
Plain, precise, operational. Sentence case. Active voice. Say what the thing is or does. Errors and states explain what happened and what continues. No hype words ("revolutionary", "AI-powered"), no exclamation marks, no emojis.

## Names (use consistently)
Product: ElectroCast-X. View: Mission Control. Panels: Scenarios, Layers, Sensors, Storm cell, Storm X-ray, Time Machine, Create warning. Concepts: first-flash countdown, risk corridor, confidence corridor, forecast decomposition (Motion, Growth or decay, New initiation), physical evidence.

## Microcopy
| Where | Text |
|---|---|
| Sim chip | `SIMULATED` · tooltip "All data in this scenario is prepared. No live feeds." |
| Landing caption | Simulated demo scenario over Odisha |
| Empty right rail | Select a storm cell on the map. |
| Flash masked chip | Flash data masked for this storm |
| Radar down banner | Radar unavailable. Forecast continues using satellite, lightning and NWP data. Uncertainty has increased. |
| Lightning network delayed | Lightning network delayed by 11 min. Forecast continues; corridor slightly wider. |
| Synthetic tag | synthetic |
| Illustrative tag | illustrative placeholder |
| Warning footer | Text composed from verified forecast fields. LLM-verbalised (pre-generated). |
| Exposure header | Potentially affected region |
| Evidence header | Why did risk increase? |
| Contribution | Radar contributed most strongly because of rapid mixed-phase growth near −10 °C. |
| Issue button | Issue warning → toast "Warning issued for {place}" |
| CAP status | Exercise (with note "Simulated exercise. Not an operational warning.") |

## Sensor labels
Doppler radar, INSAT satellite, Lightning network, NWP forecast. Status words: Online, Delayed, Offline. Data age in mono: `2 min`, `7 min`, `11 min`, `3 h`.

## Evidence rows (only these variables)
- Rapid cloud-top cooling
- ZDR column reached the −10 °C level
- KDP core intensified
- Echo top increased by 2.1 km
- Mixed-phase radar growth
- Flash rate rising
- CAPE remains supportive
- Freezing level height

## Alert templates (numbers/places/times are placeholders filled from JSON)

**English**
High lightning risk is expected near {place} between {start} and {end}. Avoid open fields, rooftops, trees and metal structures.

**Hindi (हिन्दी), draft, needs native review**
{place} के पास {start} से {end} के बीच बिजली गिरने का उच्च जोखिम है। खुले मैदान, छत, पेड़ों और धातु की संरचनाओं से दूर रहें।

**Odia (ଓଡ଼ିଆ), draft, needs native review**
{place} ନିକଟରେ {start} ରୁ {end} ମଧ୍ୟରେ ବଜ୍ରପାତର ଉଚ୍ଚ ବିପଦ ରହିଛି। ଖୋଲା ପଡ଼ିଆ, ଛାତ, ଗଛ ଓ ଧାତୁ ନିର୍ମାଣରୁ ଦୂରେଇ ରୁହନ୍ତୁ।

Before the demo: get the Hindi and Odia text reviewed by a native speaker and update `src/data/content/alerts.json`. Odia needs a font with Odia glyphs: bundle `@fontsource/noto-sans-oriya` (subset) and `@fontsource/noto-sans-devanagari` for Hindi, loaded only inside the alert composer.

## SMS preview
Prefix "IMD-DEMO:" is **not** used (never imply an official sender). Use "ElectroCast-X demo:". Show character count against 160 (Unicode SMS counts 70 per segment: show segments for HI/OD).

## Notification preview
Lock-screen style: app icon (wordmark glyph), title "Lightning warning", body = alert text truncated to 2 lines, time "now".

## CAP 1.2 preview (fields)
```json
{
  "alert": {
    "identifier": "ECX-DEMO-A-C-A07-20260514-1600",
    "sender": "demo@electrocast-x.example",
    "sent": "2026-05-14T16:02:00+05:30",
    "status": "Exercise",
    "msgType": "Alert",
    "scope": "Public",
    "note": "Simulated exercise. Not an operational warning.",
    "info": [{
      "language": "en-IN",
      "category": "Met",
      "event": "Lightning",
      "responseType": "Shelter",
      "urgency": "Expected",
      "severity": "Severe",
      "certainty": "Likely",
      "effective": "2026-05-14T16:20:00+05:30",
      "expires": "2026-05-14T16:45:00+05:30",
      "senderName": "ElectroCast-X (demo)",
      "headline": "High lightning risk near {place}",
      "description": "…",
      "instruction": "Avoid open fields, rooftops, trees and metal structures.",
      "area": { "areaDesc": "{place}", "polygon": "lat,lon lat,lon …" }
    }]
  }
}
```
Field values come from the selected cell and horizon. `polygon` is the selected corridor's coordinates in `lat,lon` order, closed. `certainty` maps from confidence (High → Likely, Moderate → Likely, Low → Possible). `urgency` maps from lead time (under 15 min → Immediate, else Expected).
Note: India's SACHET platform uses CAP; do not use "SACHET" or "IMD" as a sender in the demo.

## Pipeline page copy
Stage names, exactly as in the idea: Quality control and time alignment; Common grid with missing-sensor and data-age masks; Temperature-coordinate electrification features; Multimodal temporal transformer with neural advection; First-lightning survival head and Active-storm density head; Conformal calibration and uncertainty; Risk corridors, evidence and alerts.

## Validation page copy
Title "Reliability and skill". Every chart and number tagged `illustrative placeholder`. A sentence under the title: "Shown to demonstrate the metrics ElectroCast-X will be evaluated on. These values are not results."
