# 10 — QA checklist (run in phase 7, and before every demo)

## Truthfulness
- [ ] `SIMULATED` chip visible on every route.
- [ ] Every synthetic count, asset and metric carries `synthetic` or `illustrative placeholder`.
- [ ] `npm run check:data` passes; no hand-edited scenario JSON.
- [ ] No number on screen that is not from JSON or `src/lib/derive`.
- [ ] CAP status is `Exercise`; no real sender names.

## Flow (unaided, 3 minutes)
- [ ] Landing → Mission Control in one click.
- [ ] A: countdown shows 42 / 71 / 89, window 18–27 min, Moderate.
- [ ] A: first flash appears at +25 and inside the window.
- [ ] Decomposition shows three colours and a new-initiation site.
- [ ] X-ray opens in under 1s, slider moves the slice, ZDR column reaches −10 °C.
- [ ] Radar off: risk 71 → 46, corridor widens, contribution sentence appears.
- [ ] Any two sensors off: values stay between floor and baseline; no NaN.
- [ ] Alert composer: EN/HI/OD, SMS, phone, CAP all populate; Hindi and Odia glyphs render.
- [ ] Prediction vs Actual swipe works at +25.
- [ ] B: exposure shows 3 villages, 2 schools, 1 transmission corridor, arrival 24 min.
- [ ] C: radar offline banner appears at the right frame; corridor widens smoothly.
- [ ] Guided demo runs start to finish.

## Performance
- [ ] 60 fps at 1080p during playback (Chrome Performance, no long tasks over 50 ms).
- [ ] Paused: CPU near idle.
- [ ] First-load JS within budgets (landing ≤ 120 KB, Mission Control ≤ 220 KB gzip).
- [ ] X-ray and validation chunks load lazily.
- [ ] Works with the network disabled (DevTools offline, hard reload of `out/`).

## Accessibility
- [ ] All controls reachable by keyboard; focus ring visible.
- [ ] Space play/pause, ←/→ step, `[` `]` collapse rails.
- [ ] `prefers-reduced-motion`: no drift, pulse or widening tween.
- [ ] No more than 3 flashes per second.
- [ ] Text contrast ≥ 4.5:1 (check `fg-3` on `rail`, use `fg-2` for anything informative).

## Environments
- [ ] Demo laptop at projector resolution (1280×720 and 1920×1080).
- [ ] Chrome and Edge current; Firefox smoke test.
- [ ] Window resize, rail collapse, full-screen.
- [ ] `out/` served by `npx serve out` on a laptop with Wi-Fi off.
