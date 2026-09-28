# ElectroCast-X — Lightning Mission Control

Hardcoded frontend demo for **SIH PS26072**. A physics-guided multimodal lightning nowcasting system, shown as one operational interface over Odisha with three prepared scenarios.

> Every scenario in this app is simulated. No live data, no backend, no model inference.

## Run

```bash
npm install
npm run dev         # http://localhost:3000
npm run verify      # typecheck + tests + data invariants + static build
npm run build && npm run serve   # serve the offline static export from out/
```

## Where things are

| Path | Purpose |
|---|---|
| `AGENTS.md` / `CLAUDE.md` | Rules for coding agents (`CLAUDE.md` imports `AGENTS.md`) |
| `phases.md` | Build plan: phases → chunks, each with dependencies, verification and a ready prompt |
| `docs/` | Product brief, design system, UI spec, motion and performance, data contract, architecture, content, demo script, traceability, decisions, QA |
| `src/app` | Routes: `/` landing, `/mission-control`, `/how-it-works`, `/validation` |
| `src/components` | `ui` primitives, `shell`, `map`, `panels`, `xray`, `alerts`, `landing`, `pipeline`, `validation` |
| `src/lib` | Pure logic: `derive` (risk, corridor, countdown, exposure), `map` (canvas engine), `geo`, `i18n` |
| `src/store` | The single Zustand store |
| `src/data` | Scenario JSON, Odisha geo, synthetic assets, alert content |
| `scripts` | Deterministic scenario generator and data-invariant validator |
| `tests` | Vitest unit tests for derive functions and data invariants |

## Start building

Open `phases.md`, begin at chunk **0.1**, and paste its prompt into your coding agent.

## Stack

Next.js 16 (static export) · React 19 · Tailwind v4 · Motion (LazyMotion) · Zustand · d3-geo + Canvas 2D for the map · React Three Fiber (lazy, X-ray only) · ECharts (lazy, validation only) · Fontsource (Instrument Sans, IBM Plex Mono).
