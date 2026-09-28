# 00 — Product brief

## One line
ElectroCast-X tells a duty forecaster **when** a developing cloud will first produce lightning, **where** an active storm will go, and **how far to trust it and why**, 15, 30 and 60 minutes ahead.

## Who it is for
- **Primary user:** a duty forecaster or disaster-management officer at a state weather desk (think IMD regional centre or a State Disaster Management Authority control room). They need to decide whether to issue a warning, for which area, in the next few minutes.
- **Secondary user:** the SIH judge, who has 5 minutes and must believe this is a coherent product.

## The three questions (the whole UI is organised around these)
1. **When** will it first flash? → first-flash countdown, survival probabilities.
2. **Where** will it go? → risk corridors, forecast decomposition, exposure.
3. **How sure are we, and why?** → confidence corridor, sensor lab, evidence panel.

## Why Odisha
Lightning is the deadliest natural hazard in Odisha in the period covered by state figures: the state reported roughly 1,600 deaths over five financial years (2019-20 to 2023-24), with Mayurbhanj, Ganjam, Keonjhar and Balasore the worst hit. Victims are mostly people working outdoors. The state has recognised lightning as a state-specific disaster since 2015. This gives the demo a real, local reason to exist and makes Odia the natural regional alert language.

## What the demo must prove (see 08-ps-traceability.md)
Every claim in the PS idea has one visible proof on screen. Nothing is claimed that is not shown.

## What the demo is not
- Not a live system. All scenarios are prepared, labelled `Simulated demo scenario`.
- Not a model. No inference runs. Interactivity selects between precomputed or formula-derived values.
- Not a data product. No real radar or satellite imagery is used.

## Scenarios
| ID | Name | Region | Story |
|---|---|---|---|
| A | First lightning | Mayurbhanj–Keonjhar border | A developing cell intensifies and produces its first flash about 25 min after the forecast time |
| B | Active severe storm | Keonjhar → Balasore | An electrified storm moves toward a populated area while flash density rises |
| C | Sensor failure | Cuttack–Khordha | Radar drops out; forecast continues on satellite, lightning network and NWP with a wider corridor |

## Success criteria
- A judge who has never seen it can complete the demo flow unaided in under 3 minutes.
- The presenter can run the full flow without a single loading state, error or network call.
- Every number on screen can be traced to JSON or a derive function.
