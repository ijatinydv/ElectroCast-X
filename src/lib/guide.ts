import guideContent from "@/data/content/guide.json";
import type { AppState } from "@/types/store";

// provides the limited Zustand interface required by guide actions and tests
export interface GuideStore {
  getState: () => AppState;
}

// constrains guide content to the supported state-only demonstration actions
type GuideActionName = "scenarioA" | "play" | "selectCell" | "decomposition" | "xray" | "radarOff" | "alertComposer" | "issueWarning" | "compare";

// represents a validated authored caption before it is bound to its store action
interface GuideContentStep {
  caption: string;
  durationMs: number;
  action: GuideActionName;
}

// keeps authored captions, timing, and state transitions together for the guided flow
export interface GuideStep {
  caption: string;
  durationMs: number;
  action: (store: GuideStore) => void;
}

// identifies the prepared first-flash cell used throughout the authored demo script
const GUIDE_CELL_ID = "C-A07";

// applies each authored action through the shared store without dispatching DOM events
const guideActions: Record<GuideActionName, GuideStep["action"]> = {
  scenarioA: (store) => store.getState().selectScenario("A"),
  play: (store) => store.getState().setPlaying(true),
  selectCell: (store) => store.getState().selectCell(GUIDE_CELL_ID),
  decomposition: (store) => store.getState().setDecomposition(true),
  xray: (store) => {
    const state = store.getState();
    state.setPanel("xray", true);
    state.setXraySliceAltitude(state.xraySliceAltitudeKm + 10 / 6.5);
  },
  radarOff: (store) => store.getState().toggleSensor("radar"),
  alertComposer: (store) => {
    const state = store.getState();
    state.setPanel("xray", false);
    state.toggleSensor("radar");
    state.setPanel("alert", true);
  },
  issueWarning: (store) => {
    const state = store.getState();
    if (state.selectedCellId) state.issueWarning({ tMin: state.timeMin, cellId: state.selectedCellId, horizon: state.horizon });
  },
  compare: (store) => {
    const state = store.getState();
    state.setPanel("alert", false);
    state.setPlaying(false);
    state.setTime(25);
    state.setCompare({ on: true });
  },
};

// binds the JSON-authored sequence to the only state actions the guide can perform
export const guideSteps: readonly GuideStep[] = (guideContent as GuideContentStep[]).map((step) => ({
  caption: step.caption,
  durationMs: step.durationMs,
  action: guideActions[step.action],
}));

// allows tests and the browser runner to provide an interruptible duration wait
export type GuideWait = (durationMs: number, signal: AbortSignal) => Promise<void>;

// waits for the caption dwell time while promptly resolving when the guide is stopped
export const waitForGuideStep: GuideWait = (durationMs, signal) => new Promise((resolve) => {
  const timeoutId = window.setTimeout(resolve, durationMs);
  signal.addEventListener("abort", () => {
    window.clearTimeout(timeoutId);
    resolve();
  }, { once: true });
});

// runs one state-only guide sequence at a time and resets it safely when interrupted
export class GuideRunner {
  private abortController: AbortController | null = null;
  private runId = 0;

  constructor(private readonly store: GuideStore, private readonly wait: GuideWait = waitForGuideStep) {}

  // starts from a repeatable baseline before progressing through the authored sequence
  async run(): Promise<void> {
    this.stop();
    const runId = ++this.runId;
    const abortController = new AbortController();
    this.abortController = abortController;
    this.store.getState().resetGuidedDemo();
    this.store.getState().setGuided({ on: true, step: 0 });

    for (const [stepIndex, step] of guideSteps.entries()) {
      if (abortController.signal.aborted) return;
      this.store.getState().setGuided({ step: stepIndex });
      step.action(this.store);
      await this.wait(step.durationMs, abortController.signal);
    }

    if (this.runId === runId && !abortController.signal.aborted) {
      this.store.getState().setGuided({ on: false, step: 0 });
      this.abortController = null;
    }
  }

  // cancels pending caption time and returns all guided controls to the initial operator state
  stop(): void {
    if (!this.abortController) return;
    this.abortController.abort();
    this.abortController = null;
    this.runId += 1;
    this.store.getState().resetGuidedDemo();
  }
}
