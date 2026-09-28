# 06 — Demo script

Target: 3 minutes. Presenter talks in the three questions: **when, where, how sure.**

## Flow

| # | Action | Say | Proves |
|---|---|---|---|
| 1 | Landing page, live storm behind headline. Click "Open Mission Control". | "Lightning is the deadliest natural hazard in Odisha. Warnings today start after the first flash. We forecast before it." | Product framing, real problem |
| 2 | Select Scenario A. Press play. | "A developing cloud over Mayurbhanj. Cyan is what sensors measured, purple is what the model forecasts." | Time Machine, observed vs forecast |
| 3 | Click cell `C-A07`. | "When will it first flash? Estimated window 18 to 27 minutes, 71% within 30." Point out the masked-flash chip: "For this mode we exclude the storm's own lightning so the model can't cheat." | Survival head, data-leakage guard |
| 4 | Toggle Forecast decomposition. | "Motion, growth, and a new initiation site here. Three separate effects, not a blurry next frame." | Neural advection |
| 5 | Open X-ray. Drag the altitude slider to −10 °C. | "Lightning forms in the mixed-phase layer. The ZDR column has reached the −10 °C level. That is the physical signal, not a pattern in pixels." | Temperature-coordinate features |
| 6 | Close X-ray. Switch off Radar in the sensor lab. | "What if radar goes down? Risk falls from 71 to 46 and the corridor widens, because we would rather be honestly uncertain than falsely precise. Radar mattered most because of mixed-phase growth near −10 °C." | Counterfactual explainability, conformal corridor, missing-sensor robustness |
| 7 | Switch Radar back on. Click "Create warning". Show English, Hindi, Odia, SMS, phone, CAP. | "Every number in this text is filled from the forecast. The language model only phrases it." | Alert generation, CAP |
| 8 | Issue warning. Drag the scrubber to +25. Turn on Prediction vs Actual. | "Here is what actually happened: first flash at 25 minutes, inside the window we gave." | Retrospective outcome |
| 9 (optional) | Scenario C, or Scenario B exposure. | "When a source really fails, the system says so and keeps going." | Sensor Health Centre |

## Guided demo mode
`Guided demo` button in the top bar runs the same flow automatically with caption toasts at the bottom of the map and a Stop button. Use it if a step is failing or the presenter loses the thread. Steps map 1:1 to the table above.

## If something breaks
1. Reload the page: the app is static; state resets, nothing is lost.
2. Press Guided demo.
3. Fall back to the recorded WebM in `public/media/demo.webm` (recorded in phase 7).

## Likely judge questions (prepare answers)
- **Is this real data?** No. It is a simulated scenario built to demonstrate the interface and the behaviour of the system. It is labelled on every screen.
- **Where do the probabilities come from?** From the model design in the idea: a survival head for first-flash timing and a density head for active storms, calibrated with conformal prediction. In this demo they are prepared values.
- **Why not just a bigger vision model?** Lightning depends on internal microphysics in the mixed-phase layer. We extract those variables explicitly, so the forecast is explainable and less prone to spurious visual patterns.
- **What about false alarms?** The validation page shows the illustrative metrics we would report (POD, FAR, CSI, Brier, reliability) and why calibrated corridors reduce false precision.
- **Is the LLM making the forecast?** Never. It only converts verified fields into multilingual text.
- **How does it scale nationally?** One shared backbone; small regional LoRA adapters only when adapting to a climate region.
- **Which data do you need?** Doppler radar, INSAT imagery, a lightning network, and NWP fields. All named in the sensor lab.
