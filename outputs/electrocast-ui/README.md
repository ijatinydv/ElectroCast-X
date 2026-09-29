# ElectroCast-X Frontend Demo

ElectroCast-X is a dependency-free, hardcoded SIH demonstration frontend for multi-sensor lightning nowcasting. It is designed for an evaluator-facing live demo: every visible forecast value is synthetic and the UI is explicitly labelled **SIMULATED DEMO**.

## Run locally

From the repository root:

```bash
python3 -m http.server 4173 --directory outputs/electrocast-ui
```

Open <http://localhost:4173>.

No package installation, build process, or API key is required. Internet access is optional and is used only for the ESRI World Imagery basemap; the application shell and forecast overlays still render if tiles are unavailable.

## 749280b visual refresh

The current build applies the referenced mission-control design language while preserving the original five-screen workflow:

- Live ESRI World Imagery tiles with attribution, an Odisha boundary glow, and backed geographic labels
- Lightning-logo command bar with stacked IST/UTC clocks and compact SIM status
- Monospace operation headers with animated chevrons and deeper design tokens
- Pulsing C-07 cell designation and SCN-A/B/C scenario badges
- Compact LIVE transport dock with direct Compare/Replay access
- Observed-state X-Ray treatment, animated warning action, and exposure cards

## Recommended 3-minute demo flow

1. **Mission Control** — select `First Lightning`, switch between +15 / +30 / +60 minute horizons, toggle Radar/Risk/Flashes/Assets, and scrub or play the timeline.
2. **Storm X-Ray** — open cell `C-07`, rotate the 3D storm, move across the 0°C/−10°C/−20°C layers, and compare Reflectivity/ZDR/KDP/Mixed Phase views.
3. **Evidence Lab** — disable Doppler Radar to demonstrate graceful degradation: confidence decreases, the risk corridor widens, and the explanation changes. Reset the sensors afterwards.
4. **Alert Centre** — switch between English, Hindi, and Punjabi; show the locked verified fields, exposure summary, phone preview, and simulated delivery channels.
5. **Replay** — play the predicted-versus-observed event, then show the timing error, corridor hit, and calibration metrics.

## Implemented interactions

- Three deterministic operational scenarios, including a radar-outage mode
- Animated radar echoes, risk corridor, lightning flashes, map timeline, speed and lead-time controls
- Physics-focused Storm X-Ray with temperature slicing and polarimetric field modes
- Counterfactual sensor ablation with recalculated confidence, probability, corridor width, contribution bars, and explanations
- Forecast decomposition into motion, growth/decay, initiation, and final nowcast
- Verified-field alert composer with multilingual messages and mobile preview
- Safe local-only dispatch confirmation; no real message is sent
- Predicted-versus-observed replay with validation and reliability panels
- Responsive command-centre layout and reduced-motion accessibility support

## Honest system boundary

This package implements the complete interactive frontend experience. It does **not** run trained radar/satellite models, ingest live MoES feeds, predict real lightning, or transmit real alerts. Those production capabilities should later replace the deterministic scenario data behind the same interface.

## Files

- `index.html` — semantic application structure and all demo views
- `styles.css` — responsive styling, 3D/CSS graphics, and animations
- `app.js` — scenario state, canvas rendering, interactions, uncertainty logic, and replay
