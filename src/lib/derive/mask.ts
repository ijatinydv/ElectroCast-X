import type { Frame, SensorId } from "@/types/scenario";

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

// converts sensor loss and the stalest still-enabled source into corridor uncertainty
export function widthScale(mask: SensorMask, sensorHealth: Frame["sensorHealth"]): number {
  const sensorPenalty = (mask.radar ? 0.35 : 0)
    + (mask.insat ? 0.15 : 0)
    + (mask.nwp ? 0.1 : 0)
    + (mask.lightning ? 0.2 : 0);
  const worstDataAgeMin = (Object.keys(mask) as SensorId[]).reduce<number>((worst, sensor) => {
    const age = mask[sensor] ? null : sensorHealth[sensor].dataAgeMin;
    return age === null ? worst : Math.max(worst, age);
  }, 0);
  const stale = Math.min(0.25, Math.max(0, (worstDataAgeMin - 10) / 60));

  return 1 + sensorPenalty + stale;
}
