import type { SensorId } from "./scenario";

// limits scenario selection to the three deterministic prepared narratives
export type ScenarioId = "A" | "B" | "C";

// names map layers whose visibility must remain globally coordinated
export type LayerId = "districts" | "radar" | "satellite" | "flashDensity" | "corridors" | "assets" | "lightning";

// records an operator action against its time cell and horizon
export type Warning = { tMin: number; cellId: string; horizon: 15 | 30 | 60 };

// describes the single state surface consumed by future mission-control views
export interface AppState {
  scenarioId: ScenarioId;
  timeMin: number;
  playing: boolean;
  speed: 1 | 2 | 4;
  sensorOff: Record<SensorId, boolean>;
  selectedCellId: string | null;
  mapMode: "radar" | "satellite";
  layers: Record<LayerId, boolean>;
  decomposition: boolean;
  compare: { on: boolean; split: number };
  panels: { xray: boolean; alert: boolean; left: boolean; right: boolean };
  issuedWarnings: Warning[];
  guided: { on: boolean; step: number };
  selectScenario: (scenarioId: ScenarioId) => void;
  setTime: (timeMin: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  toggleSensor: (sensorId: SensorId) => void;
  selectCell: (cellId: string | null) => void;
  setMapMode: (mapMode: "radar" | "satellite") => void;
  toggleLayer: (layerId: LayerId) => void;
  setDecomposition: (decomposition: boolean) => void;
  setCompare: (compare: Partial<AppState["compare"]>) => void;
  setPanel: (panel: keyof AppState["panels"], open: boolean) => void;
  issueWarning: (warning: Warning) => void;
  setGuided: (guided: Partial<AppState["guided"]>) => void;
}
