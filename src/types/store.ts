import type { Scenario, SensorId, CellId, Frame } from "./scenario";

export interface AppState {
  scenario: Scenario | null;
  timeMin: number;
  selectedCellId: CellId | null;
  sensorMask: Record<SensorId, boolean>; // true means sensor is OFF
  issuedWarnings: string[];
  playbackSpeed: number;
  isPlaying: boolean;
  
  selectScenario: (scenario: Scenario) => void;
  setTimeMin: (t: number) => void;
  selectCell: (id: CellId | null) => void;
  toggleSensor: (id: SensorId) => void;
  issueWarning: (msg: string) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaying: (playing: boolean) => void;
}
