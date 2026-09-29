import { describe, expect, it } from "vitest";
import { GuideRunner, guideSteps } from "@/lib/guide";
import type { AppState } from "@/types/store";

// creates a focused store double that records guide action calls without rendering components
function createGuideStore(): { state: AppState; resetCount: number } {
  let resetCount = 0;
  const state = {
    selectedCellId: null,
    timeMin: -60,
    horizon: 30,
    xraySliceAltitudeKm: 5,
    guided: { on: false, step: 0 },
    selectScenario: () => undefined,
    setPlaying: () => undefined,
    selectCell: (cellId: string | null) => { state.selectedCellId = cellId; },
    setDecomposition: () => undefined,
    setPanel: () => undefined,
    setXraySliceAltitude: (altitudeKm: number) => { state.xraySliceAltitudeKm = altitudeKm; },
    toggleSensor: () => undefined,
    issueWarning: () => undefined,
    setTime: (timeMin: number) => { state.timeMin = timeMin; },
    setCompare: () => undefined,
    setGuided: (guided: Partial<AppState["guided"]>) => { state.guided = { ...state.guided, ...guided }; },
    resetGuidedDemo: () => { resetCount += 1; state.guided = { on: false, step: 0 }; },
  } as unknown as AppState;
  return { state, get resetCount() { return resetCount; } };
}

describe("guided demo", () => {
  it("contains the nine authored demo steps", () => {
    expect(guideSteps).toHaveLength(9);
  });

  it("resets before starting and leaves the final comparison state", async () => {
    const fixture = createGuideStore();
    const runner = new GuideRunner({ getState: () => fixture.state }, async () => undefined);

    await runner.run();

    expect(fixture.resetCount).toBe(1);
    expect(fixture.state.selectedCellId).toBe("C-A07");
    expect(fixture.state.timeMin).toBe(25);
    expect(fixture.state.guided.on).toBe(false);
  });

  it("resets an active sequence when stopped", async () => {
    const fixture = createGuideStore();
    let releaseWait: (() => void) | undefined;
    const runner = new GuideRunner({ getState: () => fixture.state }, () => new Promise((resolve) => { releaseWait = resolve; }));
    const running = runner.run();

    runner.stop();
    releaseWait?.();
    await running;

    expect(fixture.resetCount).toBe(2);
    expect(fixture.state.guided.on).toBe(false);
  });
});
