import type { Cell, Frame, Scenario } from "@/types/scenario";

// represents a longitude and latitude pair used by cells and corridor vertices
type Position = [number, number];

// captures one forecast horizon's corridor geometry without widening its public type
type Corridor = Cell["corridors"]["15"];

// keeps timeline requests within the prepared scenario's supported playback range
function clampTime(timeMin: number): number {
  return Math.min(60, Math.max(-60, timeMin));
}

// blends scalar observations without changing their physical progression between frames
function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

// softens corridor geometry movement while preserving its matching vertex order
function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

// creates a new coordinate so interpolation never mutates prepared scenario data
function interpolatePosition(start: Position, end: Position, progress: number): Position {
  return [lerp(start[0], end[0], progress), lerp(start[1], end[1], progress)];
}

// interpolates equal-length polygon vertices prepared by the scenario generator
function interpolatePolygon(start: Position[], end: Position[], progress: number): Position[] {
  return start.map((position, index) => interpolatePosition(position, end[index] ?? position, progress));
}

// retains the corridor's three uncertainty boundaries while easing their visual motion
function interpolateCorridor(start: Corridor, end: Corridor, progress: number): Corridor {
  const easedProgress = smoothstep(progress);

  return {
    center: interpolatePolygon(start.center, end.center, easedProgress),
    inner: interpolatePolygon(start.inner, end.inner, easedProgress),
    outer: interpolatePolygon(start.outer, end.outer, easedProgress),
  };
}

// interpolates a matching forecast cell while taking categorical properties from the nearest frame
function interpolateCell(start: Cell, end: Cell, progress: number): Cell {
  const nearest = progress < 0.5 ? start : end;
  const interpolateOptional = (startValue: number | undefined, endValue: number | undefined): number | undefined =>
    startValue === undefined || endValue === undefined ? nearest.activeRisk30 : lerp(startValue, endValue, progress);

  return {
    ...nearest,
    centroid: interpolatePosition(start.centroid, end.centroid, progress),
    radiusKm: lerp(start.radiusKm, end.radiusKm, progress),
    reflectivityDbz: lerp(start.reflectivityDbz, end.reflectivityDbz, progress),
    cloudTopCoolingKmin: lerp(start.cloudTopCoolingKmin, end.cloudTopCoolingKmin, progress),
    echoTopKm: lerp(start.echoTopKm, end.echoTopKm, progress),
    kdpCore: lerp(start.kdpCore, end.kdpCore, progress),
    updraftMs: lerp(start.updraftMs, end.updraftMs, progress),
    cape: lerp(start.cape, end.cape, progress),
    freezingLevelKm: lerp(start.freezingLevelKm, end.freezingLevelKm, progress),
    flashRate: lerp(start.flashRate, end.flashRate, progress),
    headlineRisk: lerp(start.headlineRisk, end.headlineRisk, progress),
    activeRisk30: interpolateOptional(start.activeRisk30, end.activeRisk30),
    motion: {
      dirDeg: lerp(start.motion.dirDeg, end.motion.dirDeg, progress),
      speedKmh: lerp(start.motion.speedKmh, end.motion.speedKmh, progress),
    },
    corridors: {
      "15": interpolateCorridor(start.corridors["15"], end.corridors["15"], progress),
      "30": interpolateCorridor(start.corridors["30"], end.corridors["30"], progress),
      "60": interpolateCorridor(start.corridors["60"], end.corridors["60"], progress),
    },
    decomposition: {
      motion: lerp(start.decomposition.motion, end.decomposition.motion, progress),
      growth: lerp(start.decomposition.growth, end.decomposition.growth, progress),
      initiation: lerp(start.decomposition.initiation, end.decomposition.initiation, progress),
      initiationSites: nearest.decomposition.initiationSites,
    },
    firstFlash: interpolateFirstFlash(start, end, nearest, progress),
  };
}

// blends first-flash measurements while retaining categorical confidence from the nearer frame
function interpolateFirstFlash(start: Cell, end: Cell, nearest: Cell, progress: number): Cell["firstFlash"] {
  if (!start.firstFlash || !end.firstFlash) {
    return nearest.firstFlash;
  }

  return {
    ...nearest.firstFlash!,
    p15: lerp(start.firstFlash.p15, end.firstFlash.p15, progress),
    p30: lerp(start.firstFlash.p30, end.firstFlash.p30, progress),
    p60: lerp(start.firstFlash.p60, end.firstFlash.p60, progress),
    windowMin: [
      lerp(start.firstFlash.windowMin[0], end.firstFlash.windowMin[0], progress),
      lerp(start.firstFlash.windowMin[1], end.firstFlash.windowMin[1], progress),
    ],
    minutesSinceAppeared: lerp(start.firstFlash.minutesSinceAppeared, end.firstFlash.minutesSinceAppeared, progress),
  };
}

// pairs cells by stable id so frame ordering cannot alter their interpolated positions
function interpolateCells(start: Cell[], end: Cell[], progress: number): Cell[] {
  const endById = new Map(end.map((cell) => [cell.id, cell]));
  return start.map((cell) => {
    const endingCell = endById.get(cell.id);
    return endingCell ? interpolateCell(cell, endingCell, progress) : cell;
  });
}

// returns a continuous read-only scenario frame for the requested simulation minute
export function frameAt(scenario: Scenario, timeMin: number): Frame {
  const time = clampTime(timeMin);
  const frames = scenario.frames;
  const firstFrame = frames[0];
  const lastFrame = frames.at(-1);

  if (!firstFrame || !lastFrame) {
    throw new Error("Scenario requires at least one frame");
  }

  if (time <= firstFrame.t) {
    return { ...firstFrame, t: time };
  }

  if (time >= lastFrame.t) {
    return { ...lastFrame, t: time };
  }

  const endIndex = frames.findIndex((frame) => frame.t >= time);
  const end = frames[endIndex];
  const start = frames[endIndex - 1];

  if (!start || !end) {
    return { ...lastFrame, t: time };
  }

  const progress = (time - start.t) / (end.t - start.t);
  const nearest = progress < 0.5 ? start : end;

  return {
    ...nearest,
    t: time,
    cells: interpolateCells(start.cells, end.cells, progress),
    sensorHealth: time < end.t ? start.sensorHealth : end.sensorHealth,
  };
}
