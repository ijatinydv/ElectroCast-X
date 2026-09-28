import type { Cell, Frame, Scenario } from "@/types/scenario";

const smooth = (v: number) => v * v * (3 - 2 * v);
// Produces continuous position, radius, intensity and corridor geometry between generated frames.
export function frameAt(scenario: Scenario, value: number): Frame {
  const time = Math.max(-60, Math.min(60, value));
  const nextIndex = scenario.frames.findIndex((frame) => frame.t >= time);
  if (nextIndex <= 0) return scenario.frames[0]!;
  if (nextIndex < 0) return scenario.frames.at(-1)!;
  const before = scenario.frames[nextIndex - 1]!; const after = scenario.frames[nextIndex]!; const p = smooth((time - before.t) / (after.t - before.t));
  const afterById = new Map(after.cells.map((cell) => [cell.id, cell]));
  const cells = before.cells.map((a) => {
    const b = afterById.get(a.id); if (!b) return a;
    const lerp = (x: number, y: number) => x + (y - x) * p;
    const polygon = (x: [number, number][], y: [number, number][]) => x.map((point, i) => [lerp(point[0], y[i]![0]), lerp(point[1], y[i]![1])] as [number, number]);
    const result: Cell = { ...(p < .5 ? a : b), centroid: [lerp(a.centroid[0], b.centroid[0]), lerp(a.centroid[1], b.centroid[1])], radiusKm: lerp(a.radiusKm, b.radiusKm), reflectivityDbz: lerp(a.reflectivityDbz, b.reflectivityDbz), echoTopKm: lerp(a.echoTopKm, b.echoTopKm), flashRate: lerp(a.flashRate, b.flashRate), motion: { dirDeg: lerp(a.motion.dirDeg, b.motion.dirDeg), speedKmh: lerp(a.motion.speedKmh, b.motion.speedKmh) }, corridors: {} as Cell["corridors"] };
    (["15", "30", "60"] as const).forEach((h) => { result.corridors[h] = { center: polygon(a.corridors[h].center, b.corridors[h].center), inner: polygon(a.corridors[h].inner, b.corridors[h].inner), outer: polygon(a.corridors[h].outer, b.corridors[h].outer) }; });
    return result;
  });
  return { ...(p < .5 ? before : after), t: time, cells };
}
