import fs from "node:fs";
import path from "node:path";
import type { Cell, Evidence, Flash, Frame, Scenario, SensorId } from "../src/types/scenario";

const KEYFRAME_TIMES = [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 45, 60] as const;
const SENSOR_BITS: Record<SensorId, number> = { radar: 1, insat: 2, lightning: 4, nwp: 8 };
const SENSOR_IDS: SensorId[] = ["radar", "insat", "lightning", "nwp"];
const OUTPUT_DIRECTORY = path.join(process.cwd(), "src", "data", "scenarios");

// captures only the inputs needed to produce each synthetic storm narrative
type ScenarioDefinition = {
  id: Scenario["id"];
  filename: string;
  name: string;
  story: string;
  seed: number;
  region: Scenario["region"];
  cellId: string;
  mode: Cell["mode"];
  start: [number, number];
  driftPerMinute: [number, number];
  baseRisk: number;
  drops: Record<SensorId, number>;
};

// creates reproducible synthetic variations without external data
function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// keeps generated meteorological values within believable bounds
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

// rounds fixture values to stable compact JSON precision
function round(value: number, precision = 3): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

// makes every uncertainty polygon share an interpolatable vertex layout
function rectangle(center: [number, number], halfWidth: number, halfHeight: number): [number, number][] {
  const [lon, lat] = center;
  return [
    [round(lon - halfWidth), round(lat - halfHeight)],
    [round(lon + halfWidth), round(lat - halfHeight)],
    [round(lon + halfWidth), round(lat + halfHeight)],
    [round(lon - halfWidth), round(lat + halfHeight)],
  ];
}

// expands later forecast polygons around earlier paths so horizon exposures remain cumulative
function encompassingPolygon(primary: [number, number][], prior: [number, number][]): [number, number][] {
  const points = [...primary, ...prior];
  const centerLon = points.reduce((total, [lon]) => total + lon, 0) / points.length;
  const centerLat = points.reduce((total, [, lat]) => total + lat, 0) / points.length;
  const halfWidth = Math.max(...points.map(([lon]) => Math.abs(lon - centerLon)));
  const halfHeight = Math.max(...points.map(([, lat]) => Math.abs(lat - centerLat)));
  return rectangle([round(centerLon), round(centerLat)], halfWidth, halfHeight);
}

// projects a synthetic storm centroid along its prescribed trajectory
function centroidAt(definition: ScenarioDefinition, timeMin: number, random: () => number): [number, number] {
  const elapsed = timeMin + 60;
  const wobble = Math.sin(elapsed / 17) * 0.006;
  return [
    round(definition.start[0] + definition.driftPerMinute[0] * elapsed + wobble + (random() - 0.5) * 0.002),
    round(definition.start[1] + definition.driftPerMinute[1] * elapsed + Math.cos(elapsed / 19) * 0.004 + (random() - 0.5) * 0.002),
  ];
}

// supplies nested base paths for later sensor-aware uncertainty scaling
function corridorsFor(
  definition: ScenarioDefinition,
  centroid: [number, number],
): Cell["corridors"] {
  const horizon = (minutes: number) => {
    const futureCenter: [number, number] = [
      round(centroid[0] + definition.driftPerMinute[0] * minutes),
      round(centroid[1] + definition.driftPerMinute[1] * minutes),
    ];
    const width = 0.018 + minutes * 0.00046;
    const height = 0.013 + minutes * 0.0003;
    return {
      center: rectangle(futureCenter, width * 0.18, height * 0.18),
      inner: rectangle(futureCenter, width * 0.62, height * 0.62),
      outer: rectangle(futureCenter, width, height),
    };
  };
  const fifteen = horizon(15);
  const thirty = horizon(30);
  const sixty = horizon(60);
  return {
    "15": fifteen,
    "30": thirty,
    "60": {
      ...sixty,
      inner: encompassingPolygon(sixty.inner, thirty.inner),
      outer: encompassingPolygon(sixty.outer, thirty.outer),
    },
  };
}

// records the allowed physical evidence variables for every generated cell
function evidenceFor(definition: ScenarioDefinition, progress: number): Evidence[] {
  const firstFlashRows: Evidence[] = [
    { variable: "mixedPhaseGrowth", label: "Mixed-phase growth", direction: "up", delta: "+0.8 km", sparkline: [0.22, 0.31, 0.44, 0.62, 0.79] },
    { variable: "zdrColumnLevel", label: "ZDR column", direction: "up", delta: "to −10 °C", sparkline: [0.16, 0.28, 0.43, 0.57, 0.72] },
    { variable: "cloudTopCooling", label: "Cloud-top cooling", direction: "up", delta: "+1.9 K/5 min", sparkline: [0.18, 0.29, 0.46, 0.65, 0.82] },
    { variable: "cape", label: "CAPE", direction: "flat", delta: "+40 J/kg", sparkline: [0.51, 0.53, 0.54, 0.56, 0.57] },
  ];
  const activeRows: Evidence[] = [
    { variable: "flashRate", label: "Flash rate", direction: "up", delta: "+13 /min", sparkline: [0.24, 0.36, 0.52, 0.74, 0.95] },
    { variable: "kdpCore", label: "KDP core", direction: "up", delta: "+0.7 deg/km", sparkline: [0.31, 0.43, 0.55, 0.68, 0.8] },
    { variable: "echoTop", label: "Echo top", direction: "up", delta: "+2.1 km", sparkline: [0.3, 0.44, 0.59, 0.73, 0.86] },
    { variable: "freezingLevel", label: "Freezing level", direction: "flat", delta: "−0.1 km", sparkline: [0.57, 0.56, 0.55, 0.55, 0.54] },
  ];
  const rows = definition.mode === "active" ? activeRows : firstFlashRows;
  return rows.map((row, index) => ({
    ...row,
    sparkline: row.sparkline.map((point) => round(clamp(point + (progress - 0.5) * (index + 1) * 0.04, 0, 1), 2)),
  }));
}

// creates a compact normalized density grid centred on the synthetic cell
function flashDensityFor(progress: number, intensity: number): number[][] {
  const columns = 16;
  const rows = 10;
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: columns }, (_, x) => {
      const dx = (x - (columns - 1) / 2) / 4.6;
      const dy = (y - (rows - 1) / 2) / 3.1;
      return round(clamp(Math.exp(-(dx * dx + dy * dy)) * intensity * (0.72 + progress * 0.28), 0, 1), 2);
    }),
  );
}

// generates observed or forecast flashes appropriate to each scenario story
function lightningFor(
  definition: ScenarioDefinition,
  timeMin: number,
  centroid: [number, number],
  random: () => number,
): Flash[] {
  if (definition.id === "A" && timeMin < 30) return [];
  if (definition.id === "C" && timeMin < 10) return [];
  const count = definition.id === "B" ? Math.max(1, Math.round(1 + (timeMin + 60) / 18)) : 1;
  return Array.from({ length: count }, (_, index) => ({
    lonLat: [round(centroid[0] + (random() - 0.5) * 0.05), round(centroid[1] + (random() - 0.5) * 0.04)],
    tMin: definition.id === "A" ? 25 + index : timeMin,
    altKm: round(7 + random() * 4, 1),
  }));
}

// represents source freshness while preserving scenario C's radar failure
function sensorHealthFor(definition: ScenarioDefinition, frameIndex: number): Frame["sensorHealth"] {
  const radarOffline = definition.id === "C" && frameIndex >= 5;
  return {
    radar: radarOffline ? { status: "offline", dataAgeMin: null } : { status: "online", dataAgeMin: 4 },
    insat: { status: "online", dataAgeMin: 7 },
    lightning: definition.id === "C" && frameIndex >= 6 ? { status: "delayed", dataAgeMin: 11 } : { status: "online", dataAgeMin: 3 },
    nwp: { status: "online", dataAgeMin: 0 },
  };
}

// precomputes all sensor combinations from the contract's degradation formula
function sensorTableFor(definition: ScenarioDefinition): Scenario["sensorTable"] {
  const table: Record<string, number> = {};
  for (let mask = 0; mask < 16; mask += 1) {
    const disabled = SENSOR_IDS.filter((sensor) => (mask & SENSOR_BITS[sensor]) !== 0);
    const formulaRisk = Math.max(12, definition.baseRisk - disabled.reduce((total, sensor) => total + definition.drops[sensor], 0) * 0.85 ** (disabled.length - 1));
    const enabledPredecessors = disabled.map((sensor) => table[(mask & ~SENSOR_BITS[sensor]).toString()]!);
    const risk = disabled.length === 0
      ? definition.baseRisk
      : Math.min(formulaRisk, ...disabled.map((sensor) => definition.baseRisk - definition.drops[sensor]), ...enabledPredecessors);
    table[mask.toString()] = round(risk, 2);
  }
  return { [definition.cellId]: table };
}

// derives a first-flash forecast that lands exactly on the documented T0 values
function firstFlashFor(definition: ScenarioDefinition, timeMin: number, center: [number, number]): NonNullable<Cell["firstFlash"]> {
  const atT0 = timeMin === 0;
  const trend = clamp((timeMin + 60) / 60, 0, 1);
  const p30 = definition.id === "C" ? (atT0 ? 0.58 : round(0.43 + trend * 0.15, 2)) : (atT0 ? 0.71 : round(0.3 + trend * 0.41, 2));
  const p15 = definition.id === "A" && atT0 ? 0.42 : round(clamp(p30 - 0.24, 0.12, 0.75), 2);
  const p60 = definition.id === "A" && atT0 ? 0.89 : round(clamp(p30 + 0.18, p30, 0.96), 2);
  return {
    p15,
    p30,
    p60,
    windowMin: definition.id === "A" && atT0 ? [18, 27] : definition.id === "C" ? [21, 33] : [19, 31],
    confidence: definition.id === "C" && timeMin >= -10 ? "Low" : definition.id === "A" ? "Moderate" : "High",
    region: rectangle(center, 0.026, 0.019),
    minutesSinceAppeared: Math.max(0, timeMin + 60),
  };
}

// assembles one schema-complete cell from the parametric scenario definition
function cellFor(definition: ScenarioDefinition, timeMin: number, random: () => number): Cell {
  const progress = (timeMin + 60) / 120;
  const centroid = centroidAt(definition, timeMin, random);
  const activeRisk30 = definition.id === "B" ? (timeMin === 0 ? 78 : round(clamp(61 + progress * 28, 0, 95), 0)) : undefined;
  const firstFlash = definition.mode === "first-flash" ? firstFlashFor(definition, timeMin, centroid) : undefined;
  return {
    id: definition.cellId,
    centroid,
    radiusKm: round(8 + progress * (definition.id === "B" ? 12 : 8)),
    reflectivityDbz: round(35 + progress * (definition.id === "B" ? 24 : 17)),
    stage: definition.id === "B" ? (timeMin < -20 ? "electrified" : "mature") : (timeMin < 0 ? "developing" : "mixed-phase growth"),
    mode: definition.mode,
    cloudTopCoolingKmin: round(1.1 + progress * 2.3, 1),
    echoTopKm: round(8.3 + progress * 7.2, 1),
    zdrColumnLevel: progress < 0.35 ? "0C" : "-10C",
    kdpCore: round(0.5 + progress * 1.6, 2),
    updraftMs: round(8 + progress * 15, 1),
    cape: Math.round(1050 + progress * 1050),
    freezingLevelKm: round(4.4 + progress * 0.2, 1),
    flashRate: definition.id === "B" ? (timeMin === 60 ? 19 : Math.round(6 + progress * 13)) : 0,
    motion: { dirDeg: definition.id === "B" ? 78 : definition.id === "C" ? 42 : 54, speedKmh: definition.id === "B" ? 31 : 28 },
    corridors: corridorsFor(definition, centroid),
    decomposition: {
      motion: definition.id === "B" ? 0.48 : 0.34,
      growth: definition.id === "B" ? 0.42 : 0.46,
      initiation: definition.id === "A" ? 0.2 : 0.1,
      initiationSites: definition.id === "A" ? [[round(centroid[0] + 0.08), round(centroid[1] + 0.035)]] : [],
    },
    ...(firstFlash ? { firstFlash, headlineRisk: Math.round(firstFlash.p30 * 100) } : { activeRisk30, headlineRisk: activeRisk30! }),
    evidence: evidenceFor(definition, progress),
  };
}

// builds all twelve deterministic frames for one complete synthetic scenario
function framesFor(definition: ScenarioDefinition): Frame[] {
  const random = mulberry32(definition.seed);
  return KEYFRAME_TIMES.map((timeMin, frameIndex) => {
    const cell = cellFor(definition, timeMin, random);
    return {
      t: timeMin,
      kind: timeMin <= 0 ? "obs" : "forecast",
      cells: [cell],
      lightning: lightningFor(definition, timeMin, cell.centroid, random),
      sensorHealth: sensorHealthFor(definition, frameIndex),
      flashDensity: flashDensityFor((timeMin + 60) / 120, definition.id === "B" ? 0.92 : 0.56),
    };
  });
}

// adds timeline and observed outcome facts for retrospective comparison
function outcomeFor(definition: ScenarioDefinition): Pick<Scenario, "outcome" | "events"> {
  const firstFlashMin = definition.id === "A" ? 25 : undefined;
  const observedPath: [number, number][] = [0, 20, 40, 60].map((timeMin) => [
    round(definition.start[0] + definition.driftPerMinute[0] * (timeMin + 60)),
    round(definition.start[1] + definition.driftPerMinute[1] * (timeMin + 60)),
  ]);
  const observedFlashes: Flash[] = definition.id === "A"
    ? [{ lonLat: observedPath[1]!, tMin: 25, altKm: 9.2 }]
    : definition.id === "B"
      ? observedPath.map((lonLat, index) => ({ lonLat, tMin: index * 15, altKm: 8.5 + index * 0.4 }))
      : [{ lonLat: observedPath[2]!, tMin: 40, altKm: 8.1 }];
  return {
    outcome: { ...(firstFlashMin === undefined ? {} : { firstFlashMin }), observedFlashes, observedPath },
    events: [
      ...(definition.id === "A" ? [{ tMin: 25, type: "firstFlash" as const, label: "Observed first flash" }] : []),
      { tMin: 0, type: "warningIssued" as const, label: "Forecast issued" },
      { tMin: 60, type: "outcome" as const, label: "Observed outcome" },
    ],
  };
}

// converts a concise storm definition into the generated scenario contract
function scenarioFor(definition: ScenarioDefinition): Scenario {
  return {
    id: definition.id,
    name: definition.name,
    story: definition.story,
    region: definition.region,
    t0IsoIst: "2026-05-14T16:00:00+05:30",
    frames: framesFor(definition),
    sensorTable: sensorTableFor(definition),
    ...outcomeFor(definition),
  };
}

// fixes the three canonical scenario narratives and their sensor sensitivities
const DEFINITIONS: ScenarioDefinition[] = [
  {
    id: "A", filename: "a-first-flash.json", name: "First lightning", story: "Developing storm near Mayurbhanj–Keonjhar.", seed: 1307,
    region: { bbox: [85.72, 21.2, 86.48, 22.25], center: [86.1, 21.73], zoom: 8.5 }, cellId: "C-A07", mode: "first-flash",
    start: [85.91, 21.52], driftPerMinute: [0.0025, 0.00165], baseRisk: 71, drops: { radar: 25, insat: 8, lightning: 2, nwp: 4 },
  },
  {
    id: "B", filename: "b-severe-storm.json", name: "Active severe storm", story: "Electrified storm tracking from Keonjhar toward Balasore.", seed: 2311,
    region: { bbox: [86.2, 20.9, 87.3, 21.82], center: [86.75, 21.36], zoom: 8.4 }, cellId: "C-B03", mode: "active",
    start: [86.37, 21.17], driftPerMinute: [0.0042, 0.00175], baseRisk: 78, drops: { radar: 27, insat: 9, lightning: 12, nwp: 5 },
  },
  {
    id: "C", filename: "c-sensor-loss.json", name: "Sensor loss", story: "Cuttack–Khordha cell with radar failing from −10 minutes.", seed: 3319,
    region: { bbox: [85.22, 19.88, 86.35, 20.7], center: [85.79, 20.29], zoom: 8.5 }, cellId: "C-C11", mode: "first-flash",
    start: [85.46, 20.05], driftPerMinute: [0.0029, 0.0016], baseRisk: 74, drops: { radar: 16, insat: 8, lightning: 5, nwp: 5 },
  },
];

// writes byte-stable JSON fixtures that remain the only scenario data source
function writeScenarios(): void {
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  for (const definition of DEFINITIONS) {
    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, definition.filename), `${JSON.stringify(scenarioFor(definition), null, 2)}\n`);
  }
}

writeScenarios();
