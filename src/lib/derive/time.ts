import type { Scenario } from "@/types/scenario";

// derives the simulated instant from the scenario origin and shared timeline minute
export function scenarioTimeAt(scenario: Scenario, timeMin: number): Date {
  return new Date(new Date(scenario.t0IsoIst).getTime() + timeMin * 60_000);
}

// formats a simulated instant for the fixed operational clock labels
export function formatScenarioTime(scenario: Scenario, timeMin: number): { ist: string; utc: string } {
  const time = scenarioTimeAt(scenario, timeMin);
  const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
  return {
    ist: new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "Asia/Kolkata" }).format(time),
    utc: new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(time),
  };
}
