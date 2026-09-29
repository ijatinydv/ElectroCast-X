# AGENTS.md — ElectroCast-X

Instructions for any coding agent (Claude Code, Codex, Cursor, etc.) working in this repo.

## What this is

A **hardcoded, frontend-only demo** of ElectroCast-X, our SIH PS26072 idea: a physics-guided multimodal lightning nowcasting system (15/30/60 min). The UI is "Lightning Mission Control", a single operational interface driven by prepared JSON scenarios set over **Odisha**.

There is **no backend, no ML, no live API, no network call at runtime**. It must look and feel operational while being honestly labelled `Simulated demo scenario`.

Full context: `docs/00-product-brief.md`. Claim-to-screen mapping: `docs/08-ps-traceability.md`.

## Read before you build

| Working on | Read first |
|---|---|
| Any UI | `docs/01-design-system.md`, `docs/03-motion-and-performance.md` |
| Layout / panels | `docs/02-ui-spec.md` |
| Data, numbers, scenarios | `docs/04-data-contract.md` |
| State, canvas, folders | `docs/05-architecture.md` |
| Alert text, microcopy | `docs/07-content-and-copy.md` |
| Anything ambiguous | `docs/09-decisions.md` |

## Hard rules

1. **One source of truth.** Every panel is a pure function of `(scenario, time, sensorMask, selectedCellId, layers)`. No panel holds its own copy of forecast numbers.
2. **Numbers come from JSON or from `src/lib/derive/*`.** Never hardcode a probability, window, count or delta inside a component. Never let an LLM-style string invent a number.
3. **Consistency invariants** in `docs/04-data-contract.md` must hold. `npm run check:data` enforces them. Do not weaken the checker to make data pass; fix the data.
4. **Honest labelling.** `Simulated demo scenario` is always visible. Synthetic assets, exposure counts and placeholder metrics carry a visible `synthetic` or `illustrative` tag.
5. **No runtime network.** No CDN fonts, no tile servers, no remote images, no analytics. Fonts are bundled via Fontsource. The app must work fully offline from `out/`.
6. **Static export only.** No API routes, no server actions, no middleware, no `next/image` optimisation.
7. **Colour means something.** cyan = observed, purple = forecast, amber = risk/countdown/warning, red = sensor failure or severe warning only. Never use them as decoration.
8. **Meteorological language only.** Explanations name a real variable (ZDR column, KDP core, −10 °C level, echo top, cloud-top cooling, CAPE). No generic "AI insight" copy.
9. **Do not add dependencies** beyond `package.json` without recording why in `docs/09-decisions.md`. Prefer writing 30 lines over adding a package.
10. **Lazy-load heavy code.** `three`, `@react-three/*` and `echarts` are only ever imported inside dynamically loaded modules.

## Performance budgets (checked in phase 7)

- Landing first-load JS ≤ 120 KB gzip. Mission Control first-load JS ≤ 220 KB gzip, excluding the lazy X-ray and validation chunks.
- Map holds 60 fps at 1080p on an integrated GPU. Cap devicePixelRatio at 2.
- Continuous animation (radar drift, flashes, ring pulse) runs in canvas or CSS, never through React re-renders.
- Animate `transform` and `opacity` only in DOM. Pause `requestAnimationFrame` when the tab is hidden or the map is fully occluded.

## Code conventions

- TypeScript strict. No `any`. Types live in `src/types`, one file per domain.
- Components: function components, named exports, one component per file, `PascalCase.tsx`. Client components only where needed (`"use client"`).
- Pure logic in `src/lib/**` with unit tests in `tests/`. Components stay thin.
- State: one Zustand store in `src/store/`. Select narrowly (`useStore(s => s.frameIdx)`); never subscribe to the whole store.
- Styling: Tailwind v4 utilities using theme tokens from `globals.css`. No inline hex values in components. No new CSS files.
- Motion: `motion/react` with `LazyMotion` + `m.*`. No `transition-*` Tailwind classes on elements that Motion animates.
- Numbers in the UI use the `.num` class (mono, tabular).
- Text is sentence case. No ALL-CAPS labels, no `A · B · C` meta strings, no `→` appended to buttons.
- Accessibility floor: visible focus, keyboard-operable controls, `prefers-reduced-motion` respected, contrast ≥ 4.5:1 for text.

## How to work

1. Open `phases.md`, pick the next unticked chunk whose dependencies are ticked.
2. Read the docs it references. Use the chunk's prompt as the task statement.
3. Build only that chunk. Do not pre-build later chunks.
4. Run `npm run verify` and complete the chunk's "Verify" list.
5. Tick the box, note any decision in `docs/09-decisions.md`, commit with message `phase X.Y: <chunk title>`.

## Do not

- Add a backend, database, auth, or environment variables.
- Use real radar or satellite imagery, or claim real data anywhere.
- Present placeholder validation numbers as results.
- Build generic dashboard cards, gradient washes, glassmorphism, glow shadows, or bouncing motion.
- Change scenario numbers by hand in the JSON. Edit `scripts/generate-scenarios.ts` and regenerate.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
