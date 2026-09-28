# 03 — Motion and performance

Goal: feels alive and expensive, weighs almost nothing.

## Motion tiers

| Tier | What | How | Cost |
|---|---|---|---|
| 1. Continuous | Radar drift and breathing, lightning flashes, dial pulse | Canvas `requestAnimationFrame` loop, or one CSS keyframe | No React renders |
| 2. State change | Panel open/close, corridor widening, risk number tick, dial arc, warning card, timeline marker | `motion/react` (LazyMotion + `m.*`), `NumberTicker`, canvas tweens driven by the store | Small, event-driven |
| 3. Landing only | One load sequence | `blur-fade`, `text-reveal` once, then nothing | One time |

## Motion vocabulary (one language everywhere)
- Easing: `cubic-bezier(0.2, 0.7, 0.2, 1)` (`--ease-instrument`). No springs with overshoot.
- Durations: 150ms (hover, toggle), 250ms (panel, tab), 400ms (data change: corridor, dial, risk number). Nothing above 600ms except the landing sequence.
- Direction: panels enter from their docked edge. Data changes tween in place. Nothing bounces.
- Motion that answers an action is welcome. Ambient motion is limited to the storm itself and the dial pulse.

## Canvas rules
- One map canvas, one RAF loop, one render function that draws layers in fixed order.
- Layers are pure `draw(ctx, state, t)` functions; each can be turned off without touching others.
- Interpolate between the 12 keyframes for cell position, size, intensity and corridor geometry. Never snap.
- Keep the map state in a mutable ref that the RAF loop reads; React only updates it via store subscription, not per frame.
- Cap devicePixelRatio at 2. Resize with `ResizeObserver`. Pause RAF on `visibilitychange` hidden.
- Pre-render static layers (districts, graticule, labels) to an offscreen canvas and blit each frame; redraw only on resize or layer toggle.
- Radar blobs: pre-render one soft radial sprite per intensity band; draw with `drawImage` and `globalAlpha`. No per-pixel loops, no `filter: blur()` at runtime.
- Heatmap: accumulate flashes into a low-res offscreen grid (e.g. 96×64), upscale with smoothing.
- Lightning: a ring buffer of at most 200 active flashes.

## React rules
- Subscribe narrowly to store slices. No context that changes per frame.
- The clock (`timeMin`) updates the store at most 30 times a second; the canvas reads a ref at 60fps.
- Memoise derive outputs by `(scenarioId, frameIdx, maskBits, cellId)`.

## Bundle budgets
- Landing ≤ 120 KB gzip first load. Mission Control ≤ 220 KB gzip first load, excluding lazy chunks.
- Lazy chunks: X-ray (`three`, `@react-three/fiber`, `@react-three/drei`), Validation (`echarts` tree-shaken via `echarts/core`), Alert composer JSON highlighter.
- LazyMotion with `domAnimation` and `m` components everywhere. Do not import `motion` (full) in shipped code.
- No icon library barrel imports: import individual Lucide icons.
- Fonts: Instrument Sans variable (latin subset only) and IBM Plex Mono 400/500. `font-display: swap`. Everything self-hosted.

## Accessibility of motion
- `MotionConfig reducedMotion="user"` at the root. With reduced motion: no drift, no pulse, no widening tween; flashes become a static marker for 1s.
- Nothing flashes more than 3 times per second in any 1-second window (photosensitivity). Lightning flash bursts are throttled globally.

## Measurement (phase 7)
- `next build` output for route sizes; `npx source-map-explorer` optional.
- Chrome Performance panel: no long tasks over 50ms during playback; 60fps at 1080p on the demo laptop, on battery.
- Idle (paused) CPU near zero: RAF should stop when nothing animates.
