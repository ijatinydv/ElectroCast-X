export type SensorId = "radar" | "insat" | "lightning" | "nwp";
export type SensorStatus = "online" | "delayed" | "offline";
export type CellId = string;

export interface TimelineEvent {
  tMin: number;
  type: "firstFlash" | "warningIssued" | "outcome";
  label: string;
}

export interface Flash {
  lonLat: [number, number];
  tMin: number;
  altKm?: number;
}

export interface Evidence {
  variable: string;
  label: string;
  direction: "up" | "flat" | "down";
  delta: string;
  sparkline: number[];
}

export interface Outcome {
  firstFlashMin?: number;
  observedFlashes: Flash[];
  observedPath: [number, number][];
}

export interface Cell {
  id: CellId;
  centroid: [number, number];
  radiusKm: number;
  reflectivityDbz: number;
  stage: "developing" | "mixed-phase growth" | "electrified" | "mature" | "decaying";
  mode: "first-flash" | "active";
  cloudTopCoolingKmin: number;
  echoTopKm: number;
  zdrColumnLevel: "0C" | "-10C" | "-20C" | "none";
  kdpCore: number;
  updraftMs: number;
  cape: number;
  freezingLevelKm: number;
  flashRate: number;
  motion: { dirDeg: number; speedKmh: number };
  corridors: Record<"15" | "30" | "60", { center: [number, number][]; inner: [number, number][]; outer: [number, number][] }>;
  decomposition: { motion: number; growth: number; initiation: number; initiationSites: [number, number][] };
  firstFlash?: {
    p15: number;
    p30: number;
    p60: number;
    windowMin: [number, number];
    confidence: "Low" | "Moderate" | "High";
    region: [number, number][];
    minutesSinceAppeared: number;
  };
  activeRisk30?: number;
  headlineRisk: number;
  evidence: Evidence[];
}

export interface Frame {
  t: number;
  kind: "obs" | "forecast";
  cells: Cell[];
  lightning: Flash[];
  sensorHealth: Record<SensorId, { status: SensorStatus; dataAgeMin: number | null }>;
  flashDensity: number[][];
}

export interface Scenario {
  id: "A" | "B" | "C";
  name: string;
  story: string;
  region: { bbox: [number, number, number, number]; center: [number, number]; zoom: number };
  t0IsoIst: string;
  frames: Frame[];
  sensorTable: Record<CellId, Record<string, number>>;
  outcome: Outcome;
  events: TimelineEvent[];
}
