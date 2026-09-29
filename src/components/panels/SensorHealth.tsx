"use client";

import { StatusDot } from "@/components/ui/StatusDot";
import { effectiveSensorMask, type SensorMask } from "@/lib/derive";
import type { Frame, SensorId } from "@/types/scenario";

const sensorLabels: Record<SensorId, string> = { radar: "Radar", insat: "INSAT", lightning: "Lightning network", nwp: "NWP" };

interface SensorHealthProps {
  frame: Frame;
  sensorOff: SensorMask;
}

// lists current feed availability and ages for the top-bar sensor health popover
export function SensorHealth({ frame, sensorOff }: SensorHealthProps) {
  const mask = effectiveSensorMask(sensorOff, frame.sensorHealth);
  return <div className="flex min-w-52 flex-col gap-3">{(Object.keys(sensorLabels) as SensorId[]).map((sensor) => {
    const feed = frame.sensorHealth[sensor];
    const status = mask[sensor] ? "offline" : feed.status;
    return <div key={sensor} className="flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-2"><StatusDot status={status} />{sensorLabels[sensor]}<span className="text-fg-2">{status[0]!.toUpperCase() + status.slice(1)}</span></span><span className="num text-xs text-fg-2">{feed.dataAgeMin === null ? "Unavailable" : `${feed.dataAgeMin} min`}</span></div>;
  })}</div>;
}
