import type { SensorId } from "@/types/scenario";

// represents explicit sensor disablement before conversion to a table bit mask
export type SensorMask = Record<SensorId, boolean>;

const sensorBits: Record<SensorId, number> = { radar: 1, insat: 2, lightning: 4, nwp: 8 };

// converts named disabled sensors into the stable table key used by scenarios
export function maskBits(mask: Partial<SensorMask>): number {
  return (Object.entries(sensorBits) as [SensorId, number][]).reduce((bits, [sensor, bit]) => bits | (mask[sensor] ? bit : 0), 0);
}

// creates an explicit all-sensors-on mask for callers that need a stable baseline
export function enabledSensors(): SensorMask {
  return { radar: false, insat: false, lightning: false, nwp: false };
}
