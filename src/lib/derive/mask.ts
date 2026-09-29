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

// treats unavailable prepared feeds as disabled alongside an operator's explicit sensor mask
export function effectiveSensorMask(mask: Partial<SensorMask>, sensorHealth: Frame["sensorHealth"]): SensorMask {
  return {
    radar: mask.radar || sensorHealth.radar.status === "offline",
    insat: mask.insat || sensorHealth.insat.status === "offline",
    lightning: mask.lightning || sensorHealth.lightning.status === "offline",
    nwp: mask.nwp || sensorHealth.nwp.status === "offline",
  };
}

// converts disabled sensors and stale available observations into corridor uncertainty
export function widthScale(mask: SensorMask, sensorHealth: Frame["sensorHealth"]): number {
  const disabledWeight = Number(mask.radar) * 0.35 + Number(mask.insat) * 0.15 + Number(mask.nwp) * 0.1 + Number(mask.lightning) * 0.2;
  const activeAges = (Object.keys(sensorHealth) as SensorId[])
    .filter((sensor) => !mask[sensor])
    .map((sensor) => sensorHealth[sensor].dataAgeMin)
    .filter((age): age is number => age !== null);
  const worstDataAge = Math.max(0, ...activeAges);
  const stale = Math.min(0.25, Math.max(0, (worstDataAge - 10) / 60));
  return 1 + disabledWeight + stale;
}
