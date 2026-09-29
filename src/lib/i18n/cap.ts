import type { Cell, Scenario } from "@/types/scenario";

// limits CAP generation to the three prepared forecast corridors
type Horizon = 15 | 30 | 60;

// represents the fixed CAP 1.2 envelope used by the simulated exercise preview
export interface CapAlert {
  alert: {
    identifier: string;
    sender: string;
    sent: string;
    status: "Exercise";
    msgType: "Alert";
    scope: "Public";
    note: string;
    info: Array<{
      language: "en-IN";
      category: "Met";
      event: "Lightning";
      responseType: "Shelter";
      urgency: "Immediate" | "Expected";
      severity: "Severe";
      certainty: "Likely" | "Possible";
      effective: string;
      expires: string;
      senderName: "ElectroCast-X (demo)";
      headline: string;
      description: string;
      instruction: "Avoid open fields, rooftops, trees and metal structures.";
      area: { areaDesc: string; polygon: string };
    }>;
  };
}

// formats generated timestamps in the scenario's fixed IST operating timezone
function formatIst(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+05:30`;
}

// gives each preview a reproducible identifier from its scenario, cell, and issued minute
function capIdentifier(scenario: Scenario, cell: Cell, sent: Date): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(sent).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `ECX-DEMO-${scenario.id}-${cell.id}-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}`;
}

// converts GeoJSON longitude-latitude coordinates into the CAP latitude-longitude polygon string
function capPolygon(cell: Cell, horizon: Horizon): string {
  const corridor = cell.corridors[String(horizon) as keyof Cell["corridors"]].inner;
  const closed = corridor.at(0)?.[0] === corridor.at(-1)?.[0] && corridor.at(0)?.[1] === corridor.at(-1)?.[1]
    ? corridor
    : [...corridor, corridor[0]!];
  return closed.map(([longitude, latitude]) => `${latitude},${longitude}`).join(" ");
}

// maps the prepared first-flash confidence to the CAP certainty vocabulary
function capCertainty(cell: Cell): "Likely" | "Possible" {
  return cell.firstFlash?.confidence === "Low" ? "Possible" : "Likely";
}

// selects the nearest prepared risk window so CAP urgency remains tied to forecast lead time
function capWindow(cell: Cell, horizon: Horizon): readonly [number, number] {
  if (cell.firstFlash) return cell.firstFlash.windowMin;
  return [0, horizon];
}

// builds the complete simulated CAP 1.2 alert without introducing operational sender claims
export function buildCap(scenario: Scenario, cell: Cell, horizon: Horizon, place: string, issuedAtMin: number): CapAlert {
  const sent = new Date(new Date(scenario.t0IsoIst).getTime() + issuedAtMin * 60_000);
  const [startMinute, endMinute] = capWindow(cell, horizon);
  const effective = new Date(sent.getTime() + startMinute * 60_000);
  const expires = new Date(sent.getTime() + endMinute * 60_000);
  const urgency = startMinute < 15 ? "Immediate" : "Expected";
  const description = `High lightning risk is expected near ${place} between ${formatIst(effective)} and ${formatIst(expires)}.`;

  return {
    alert: {
      identifier: capIdentifier(scenario, cell, sent),
      sender: "demo@electrocast-x.example",
      sent: formatIst(sent),
      status: "Exercise",
      msgType: "Alert",
      scope: "Public",
      note: "Simulated exercise. Not an operational warning.",
      info: [{
        language: "en-IN",
        category: "Met",
        event: "Lightning",
        responseType: "Shelter",
        urgency,
        severity: "Severe",
        certainty: capCertainty(cell),
        effective: formatIst(effective),
        expires: formatIst(expires),
        senderName: "ElectroCast-X (demo)",
        headline: `High lightning risk near ${place}`,
        description,
        instruction: "Avoid open fields, rooftops, trees and metal structures.",
        area: { areaDesc: place, polygon: capPolygon(cell, horizon) },
      }],
    },
  };
}
