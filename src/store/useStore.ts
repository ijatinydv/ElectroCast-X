import { create } from "zustand";
import type { AppState, LayerId, ScenarioId } from "@/types/store";

const initialSensorOff = { radar: false, insat: false, lightning: false, nwp: false } as const;
const initialLayers: Record<LayerId, boolean> = { districts: true, radar: true, satellite: false, flashDensity: true, corridors: true, assets: true, lightning: true };

// restores state that must never leak when an operator switches demo scenarios
function scenarioReset(scenarioId: ScenarioId): Pick<AppState, "scenarioId" | "timeMin" | "selectedCellId" | "sensorOff" | "issuedWarnings"> {
  return { scenarioId, timeMin: 0, selectedCellId: null, sensorOff: { ...initialSensorOff }, issuedWarnings: [] };
}

// holds the small named controls that coordinate all mission-control surfaces
export const useStore = create<AppState>()((set) => ({
  ...scenarioReset("A"),
  playing: false,
  speed: 1,
  mapMode: "radar",
  layers: { ...initialLayers },
  decomposition: false,
  compare: { on: false, split: 0.5 },
  panels: { xray: false, alert: false, left: true, right: true },
  guided: { on: false, step: 0 },
  selectScenario: (scenarioId) => set(scenarioReset(scenarioId)),
  setTime: (timeMin) => set({ timeMin: Math.min(60, Math.max(-60, timeMin)) }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  toggleSensor: (sensorId) => set((state) => ({ sensorOff: { ...state.sensorOff, [sensorId]: !state.sensorOff[sensorId] } })),
  selectCell: (selectedCellId) => set({ selectedCellId }),
  setMapMode: (mapMode) => set((state) => ({
    mapMode,
    layers: { ...state.layers, radar: mapMode === "radar", satellite: mapMode === "satellite" },
  })),
  toggleLayer: (layerId) => set((state) => ({ layers: { ...state.layers, [layerId]: !state.layers[layerId] } })),
  setDecomposition: (decomposition) => set({ decomposition }),
  setCompare: (compare) => set((state) => ({ compare: { ...state.compare, ...compare } })),
  setPanel: (panel, open) => set((state) => ({ panels: { ...state.panels, [panel]: open } })),
  issueWarning: (warning) => set((state) => ({ issuedWarnings: [...state.issuedWarnings, warning] })),
  setGuided: (guided) => set((state) => ({ guided: { ...state.guided, ...guided } })),
}));
