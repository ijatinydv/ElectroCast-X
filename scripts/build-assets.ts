import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AssetLocation, PolylineAsset, SyntheticAssets } from "../src/types/assets";

// groups generated records around the three prepared scenario regions
interface Region {
  name: string;
  bbox: [number, number, number, number];
}

// preserves a fixed seed so checked-in exposure examples never drift
const SEED = 26072;

// keeps generated exposure points near all three simulated storm stories
const REGIONS: Region[] = [
  { name: "Mayurbhanj–Keonjhar", bbox: [85.72, 21.2, 86.48, 22.25] },
  { name: "Keonjhar–Balasore", bbox: [86.2, 20.9, 87.3, 21.82] },
  { name: "Cuttack–Khordha", bbox: [85.22, 19.88, 86.35, 20.7] },
];

// supplies invented Odia-region village names without using settlement records
const VILLAGE_STEMS = [
  "Ban", "Kusum", "Mahul", "Salia", "Kendu", "Salap", "Dhaman", "Bhalu", "Gorum", "Nuaga",
  "Kiajhar", "Rangamatia", "Talapada", "Jharbera", "Badakhola", "Sundari", "Kantilo", "Dharua", "Banshuli", "Chandia",
];

// gives the invented village stems locally plausible Odia-region endings
const VILLAGE_ENDINGS = ["pada", "sahi", "pur", "gaon", "tola", "jodi"];

// creates a deterministic pseudorandom stream for generated demo records
function mulberry32(seed: number): () => number {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// samples a number inside a range using the seeded stream
function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

// locates an invented point inside the selected scenario neighborhood
function regionalPosition(region: Region, random: () => number): [number, number] {
  return [
    Number(between(random, region.bbox[0], region.bbox[2]).toFixed(5)),
    Number(between(random, region.bbox[1], region.bbox[3]).toFixed(5)),
  ];
}

// marks each location as synthetic so exposure counts cannot imply real facilities
function makePoint(
  id: string,
  name: string,
  type: AssetLocation["type"],
  lonLat: [number, number],
  population?: number,
): AssetLocation {
  return {
    id,
    name,
    lonLat,
    type,
    ...(population === undefined ? {} : { population }),
    synthetic: true,
  };
}

// distributes invented facilities across each selected scenario neighborhood
function addRegionalPoints(
  points: AssetLocation[],
  random: () => number,
  type: AssetLocation["type"],
  counts: readonly number[],
  label: string,
): void {
  for (const [regionIndex, count] of counts.entries()) {
    const region = REGIONS[regionIndex];
    if (!region) continue;
    for (let index = 0; index < count; index += 1) {
      const serial = points.length + 1;
      points.push(
        makePoint(
          `${type}-${String(serial).padStart(3, "0")}`,
          `${label} ${String(index + 1).padStart(2, "0")} near ${region.name}`,
          type,
          regionalPosition(region, random),
        ),
      );
    }
  }
}

// creates invented transmission routes that cross the prepared exposure regions
function makePolyline(id: string, name: string, region: Region, random: () => number): PolylineAsset {
  const start = regionalPosition(region, random);
  const end = regionalPosition(region, random);
  const path = Array.from({ length: 5 }, (_, index) => {
    const fraction = index / 4;
    return [
      Number((start[0] + (end[0] - start[0]) * fraction).toFixed(5)),
      Number((start[1] + (end[1] - start[1]) * fraction).toFixed(5)),
    ] as [number, number];
  });
  return { id, name, path, type: "transmission", synthetic: true };
}

// assembles the reproducible synthetic asset dataset consumed by the demo
export function buildAssets(): SyntheticAssets {
  const random = mulberry32(SEED);
  const points: AssetLocation[] = [];

  for (const [regionIndex, region] of REGIONS.entries()) {
    for (let index = 0; index < 20; index += 1) {
      const stem = VILLAGE_STEMS[(index + regionIndex * 7) % VILLAGE_STEMS.length];
      const ending = VILLAGE_ENDINGS[(index + regionIndex) % VILLAGE_ENDINGS.length];
      const population = Math.round(between(random, 350, 7600) / 50) * 50;
      points.push(
        makePoint(
          `village-${String(regionIndex * 20 + index + 1).padStart(3, "0")}`,
          `${stem}${ending}`,
          "village",
          regionalPosition(region, random),
          population,
        ),
      );
    }
  }

  // anchors the documented severe-storm exposure example inside its 30-minute inner corridor
  const severeStormVillages: [number, number][] = [[86.731, 21.312], [86.747, 21.321], [86.763, 21.332]];
  for (const [index, lonLat] of severeStormVillages.entries()) {
    points[20 + index] = makePoint(`village-${String(21 + index).padStart(3, "0")}`, `Corridor village ${String(index + 1).padStart(2, "0")}`, "village", lonLat, 1200 + index * 350);
  }

  addRegionalPoints(points, random, "school", [8, 8, 9], "Demo school site");
  addRegionalPoints(points, random, "hospital", [4, 4, 4], "Demo health facility");
  addRegionalPoints(points, random, "event", [2, 3, 3], "Demo outdoor event site");

  // anchors the documented school exposure example beside the severe-storm villages
  const severeStormSchools: [number, number][] = [[86.738, 21.315], [86.757, 21.329]];
  const schoolOffset = 60;
  for (const [index, lonLat] of severeStormSchools.entries()) {
    points[schoolOffset + index] = makePoint(`school-${String(schoolOffset + index + 1).padStart(3, "0")}`, `Demo corridor school ${String(index + 1).padStart(2, "0")}`, "school", lonLat);
  }

  points.push(
    makePoint("airport-bhubaneswar", "Biju Patnaik International Airport (synthetic demo marker)", "airport", [85.8178, 20.2446]),
    makePoint("airport-jharsuguda", "Jharsuguda Airport (synthetic demo marker)", "airport", [84.0509, 21.9132]),
  );

  const mines: AssetLocation[] = [
    makePoint("mine-keonjhar", "Demo mine site near Keonjhar", "mine", [85.62, 21.62]),
    makePoint("mine-keonjhar-east", "Demo mine site east of Keonjhar", "mine", [85.91, 21.55]),
    makePoint("mine-keonjhar-south", "Demo mine site south of Keonjhar", "mine", [85.72, 21.31]),
    makePoint("mine-sundargarh", "Demo mine site near Sundargarh", "mine", [84.85, 22.05]),
    makePoint("mine-sundargarh-east", "Demo mine site east of Sundargarh", "mine", [85.14, 22.12]),
    makePoint("mine-sundargarh-south", "Demo mine site south of Sundargarh", "mine", [84.92, 21.82]),
  ];
  points.push(...mines);

  const polylines = REGIONS.map((region, index) =>
    makePolyline(`transmission-${index + 1}`, `Demo transmission corridor ${index + 1}`, region, random),
  );
  polylines.push(makePolyline("transmission-4", "Demo northern transmission corridor", REGIONS[0]!, random));
  polylines[1] = {
    id: "transmission-2",
    name: "Demo transmission corridor 2",
    path: [[86.72, 21.305], [86.735, 21.313], [86.75, 21.322], [86.765, 21.331], [86.78, 21.34]],
    type: "transmission",
    synthetic: true,
  };

  return { points, polylines };
}

if (require.main === module) {
  const assets = buildAssets();
  const outputPath = path.resolve(process.cwd(), "src/data/assets/synthetic-assets.json");
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(assets, null, 2)}\n`);
  console.log(`Wrote ${assets.points.length} synthetic point assets and ${assets.polylines.length} polylines.`);
}
