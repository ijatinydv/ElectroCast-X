import type { Cell } from "@/types/scenario";

// fixes the compact simulation resolution used by the X-ray voxel renderer
export const VOLUME_WIDTH = 24;

// fixes the compact simulation resolution used by the X-ray voxel renderer
export const VOLUME_DEPTH = 24;

// fixes the compact simulation resolution used by the X-ray voxel renderer
export const VOLUME_HEIGHT = 16;

// identifies the deterministic centre of the strongest simulated updraft core
export interface VolumeCore {
  x: number;
  y: number;
  z: number;
}

// represents the physical fields sampled from one horizontal X-ray slice
export interface SliceReadout {
  reflectivityDbz: number;
  zdrDb: number;
  kdpDegKm: number;
}

// defines the smallest atmospheric changes that justify rebuilding voxel instance data
const volumeRebuildThreshold = {
  echoTopKm: 0.5,
  reflectivityDbz: 2,
  updraftMs: 1.5,
  freezingLevelKm: 0.25,
  kdpCore: 0.2,
} as const;

// bounds scalar values before they contribute to the generated reflectivity field
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

// turns a prepared cell identifier into a stable unsigned seed
function seedFor(cellId: string): number {
  let seed = 2166136261;
  for (let index = 0; index < cellId.length; index += 1) {
    seed ^= cellId.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

// advances the local deterministic sequence without relying on ambient random state
function nextRandom(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let value = next;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return [next, ((value ^ (value >>> 14)) >>> 0) / 4294967296];
}

// evaluates one smooth three-dimensional storm contribution at a voxel position
function gaussian(x: number, y: number, z: number, center: VolumeCore, radiusXY: number, radiusZ: number): number {
  const horizontal = ((x - center.x) ** 2 + (y - center.y) ** 2) / (2 * radiusXY ** 2);
  const vertical = (z - center.z) ** 2 / (2 * radiusZ ** 2);
  return Math.exp(-(horizontal + vertical));
}

// derives the upward-growing core location from echo height and the stable cell seed
export function volumeCoreFor(cell: Pick<Cell, "id" | "echoTopKm">): VolumeCore {
  let seed = seedFor(cell.id);
  let random: number;
  [seed, random] = nextRandom(seed);
  const x = VOLUME_WIDTH / 2 + (random - 0.5) * 2;
  [seed, random] = nextRandom(seed);
  const y = VOLUME_DEPTH / 2 + (random - 0.5) * 2;
  const echoFraction = clamp(cell.echoTopKm / 18, 0.3, 1);
  const z = clamp(Math.round(echoFraction * (VOLUME_HEIGHT - 2)), 3, VOLUME_HEIGHT - 2);
  return { x, y, z };
}

// creates a reproducible reflectivity field from the cell's measured storm structure
export function buildVolume(cell: Pick<Cell, "id" | "echoTopKm" | "reflectivityDbz" | "updraftMs">): Float32Array {
  const volume = new Float32Array(VOLUME_WIDTH * VOLUME_DEPTH * VOLUME_HEIGHT);
  const core = volumeCoreFor(cell);
  const echoFraction = clamp(cell.echoTopKm / 18, 0.3, 1);
  const reflectivity = clamp(cell.reflectivityDbz, 10, 70);
  const updraft = clamp(cell.updraftMs / 35, 0.15, 1);
  const canopy: VolumeCore = { x: VOLUME_WIDTH / 2, y: VOLUME_DEPTH / 2, z: core.z * 0.58 };
  let seed = seedFor(cell.id);
  const lobes: Array<{ center: VolumeCore; weight: number; radiusXY: number; radiusZ: number }> = [];

  for (let lobe = 0; lobe < 3; lobe += 1) {
    let random: number;
    [seed, random] = nextRandom(seed);
    const x = core.x + (random - 0.5) * (7 - lobe);
    [seed, random] = nextRandom(seed);
    const y = core.y + (random - 0.5) * (7 - lobe);
    [seed, random] = nextRandom(seed);
    const z = clamp(core.z * (0.45 + random * 0.42), 2, core.z);
    lobes.push({ center: { x, y, z }, weight: 0.16 + random * 0.1, radiusXY: 2.1 + random * 0.9, radiusZ: 1.5 + random });
  }

  for (let z = 0; z < VOLUME_HEIGHT; z += 1) {
    for (let y = 0; y < VOLUME_DEPTH; y += 1) {
      for (let x = 0; x < VOLUME_WIDTH; x += 1) {
        const index = z * VOLUME_WIDTH * VOLUME_DEPTH + y * VOLUME_WIDTH + x;
        const canopyValue = gaussian(x, y, z, canopy, 5.6, Math.max(2, core.z * 0.44)) * 0.44;
        const coreValue = gaussian(x, y, z, core, 1.55 + updraft * 0.55, 2.2 + echoFraction * 1.35) * (0.62 + updraft * 0.38);
        const lobeValue = lobes.reduce((total, lobe) => total + gaussian(x, y, z, lobe.center, lobe.radiusXY, lobe.radiusZ) * lobe.weight, 0);
        const taper = z <= core.z + 1 ? 1 : clamp(1 - (z - core.z) / 3, 0, 1);
        volume[index] = reflectivity * clamp((canopyValue + coreValue + lobeValue) * taper, 0, 1);
      }
    }
  }

  return volume;
}

// distinguishes meaningful storm-volume evolution from uniform-only interpolated changes
export function volumeNeedsRebuild(previous: Pick<Cell, "id" | "echoTopKm" | "reflectivityDbz" | "updraftMs" | "freezingLevelKm" | "zdrColumnLevel" | "kdpCore">, next: Pick<Cell, "id" | "echoTopKm" | "reflectivityDbz" | "updraftMs" | "freezingLevelKm" | "zdrColumnLevel" | "kdpCore">): boolean {
  return previous.id !== next.id
    || previous.zdrColumnLevel !== next.zdrColumnLevel
    || Math.abs(previous.echoTopKm - next.echoTopKm) >= volumeRebuildThreshold.echoTopKm
    || Math.abs(previous.reflectivityDbz - next.reflectivityDbz) >= volumeRebuildThreshold.reflectivityDbz
    || Math.abs(previous.updraftMs - next.updraftMs) >= volumeRebuildThreshold.updraftMs
    || Math.abs(previous.freezingLevelKm - next.freezingLevelKm) >= volumeRebuildThreshold.freezingLevelKm
    || Math.abs(previous.kdpCore - next.kdpCore) >= volumeRebuildThreshold.kdpCore;
}

// samples the generated storm volume and smooth physical profiles at an operator-selected altitude
export function sliceReadoutFor(cell: Pick<Cell, "id" | "echoTopKm" | "reflectivityDbz" | "updraftMs" | "freezingLevelKm" | "zdrColumnLevel" | "kdpCore">, altitudeKm: number): SliceReadout {
  const volume = buildVolume(cell);
  const heightFraction = clamp(altitudeKm / Math.max(cell.echoTopKm, 0.1), 0, 1);
  const sliceIndex = Math.round(heightFraction * (VOLUME_HEIGHT - 1));
  let totalReflectivity = 0;
  let samples = 0;

  for (let y = 0; y < VOLUME_DEPTH; y += 1) {
    for (let x = 0; x < VOLUME_WIDTH; x += 1) {
      totalReflectivity += volume[sliceIndex * VOLUME_WIDTH * VOLUME_DEPTH + y * VOLUME_WIDTH + x] ?? 0;
      samples += 1;
    }
  }

  const zdrLevelKm = cell.zdrColumnLevel === "0C" ? cell.freezingLevelKm
    : cell.zdrColumnLevel === "-10C" ? cell.freezingLevelKm + 10 / 6.5
      : cell.zdrColumnLevel === "-20C" ? cell.freezingLevelKm + 20 / 6.5
        : 0;
  const zdrEnvelope = cell.zdrColumnLevel === "none" ? 0 : Math.exp(-((altitudeKm - zdrLevelKm * 0.7) ** 2) / (2 * Math.max(zdrLevelKm * 0.36, 0.7) ** 2));
  const mixedPhaseKm = cell.freezingLevelKm + 10 / 6.5;
  const kdpEnvelope = Math.exp(-((altitudeKm - mixedPhaseKm) ** 2) / (2 * 0.85 ** 2));

  return {
    reflectivityDbz: totalReflectivity / samples,
    zdrDb: 0.15 + 2.05 * zdrEnvelope,
    kdpDegKm: 0.04 + cell.kdpCore * 0.22 * kdpEnvelope,
  };
}
