"use client";

import { effectiveSensorMask } from "@/lib/derive";
import { frameAt } from "@/lib/map/interpolate";
import { useStore } from "@/store/useStore";
import type { Scenario } from "@/types/scenario";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";

const scenarios: Record<"A" | "B" | "C", Scenario> = { A: scenarioA as unknown as Scenario, B: scenarioB as unknown as Scenario, C: scenarioC as unknown as Scenario };

// surfaces the documented operational warning whenever a source is unavailable or delayed
export function SensorBanner() {
  const scenarioId = useStore((state) => state.scenarioId);
  const timeMin = useStore((state) => state.timeMin);
  const sensorOff = useStore((state) => state.sensorOff);
  const frame = frameAt(scenarios[scenarioId], timeMin);
  const mask = effectiveSensorMask(sensorOff, frame.sensorHealth);
  const lightningDelayed = !mask.lightning && frame.sensorHealth.lightning.status === "delayed";

  if (mask.radar) return <div className="absolute left-3 right-3 top-3 z-10 border border-alert bg-rail px-3 py-2 text-sm text-fg" role="status">Radar unavailable. Forecast continues using satellite, lightning and NWP data. Uncertainty has increased.</div>;
  if (lightningDelayed) return <div className="absolute left-3 right-3 top-3 z-10 border border-risk bg-rail px-3 py-2 text-sm text-fg" role="status">Lightning network delayed by 11 min. Forecast continues; corridor slightly wider.</div>;
  return null;
}
