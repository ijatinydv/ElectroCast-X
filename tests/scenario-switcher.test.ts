import { describe, expect, it } from "vitest";
import sensorLossData from "@/data/scenarios/c-sensor-loss.json";
import { effectiveSensorMask } from "@/lib/derive";
import { useStore } from "@/store/useStore";
import type { Scenario } from "@/types/scenario";

// keeps the generated fixture typed for direct outage-boundary inspection
const sensorLoss = sensorLossData as unknown as Scenario;

// validates the reset boundary and prepared radar outage required by scenario switching
describe("scenario switcher", () => {
  it("resets operator state and applies the C radar outage at −10 minutes", () => {
    const store = useStore.getState();
    store.setTime(30);
    store.setPlaying(true);
    store.selectCell("A-C01");
    store.toggleSensor("insat");
    store.issueWarning({ tMin: 30, cellId: "A-C01", horizon: 30 });
    store.selectScenario("C");

    expect(useStore.getState()).toMatchObject({
      scenarioId: "C",
      timeMin: -60,
      playing: false,
      selectedCellId: null,
      sensorOff: { radar: false, insat: false, lightning: false, nwp: false },
      issuedWarnings: [],
    });

    const outageFrame = sensorLoss.frames.find((frame) => frame.t === -10);
    if (!outageFrame) throw new Error("Scenario C requires a −10 minute frame");
    expect(effectiveSensorMask(useStore.getState().sensorOff, outageFrame.sensorHealth).radar).toBe(true);
  });
});
