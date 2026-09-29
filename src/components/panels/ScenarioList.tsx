"use client";

import type { Scenario } from "@/types/scenario";
import type { ScenarioId } from "@/types/store";

// defines the prepared narratives consumed by the shared scenario selection control
interface ScenarioListProps {
  scenarios: Record<ScenarioId, Scenario>;
  activeScenarioId: ScenarioId;
  onSelect: (scenarioId: ScenarioId) => void;
}

// presents each prepared narrative without duplicating its name or operational story
export function ScenarioList({ scenarios, activeScenarioId, onSelect }: ScenarioListProps) {
  return (
    <ul className="flex flex-col gap-1" aria-label="Prepared scenarios">
      {(Object.keys(scenarios) as ScenarioId[]).map((scenarioId) => {
        const scenario = scenarios[scenarioId];
        const active = scenarioId === activeScenarioId;

        return (
          <li key={scenarioId}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(scenarioId)}
              className={`w-full rounded border text-left px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-line-strong ${
                active
                  ? "border-forecast/40 bg-forecast/8 shadow-sm"
                  : "border-transparent hover:bg-raised/60 hover:border-line"
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[9px] font-mono font-bold ${active ? "text-forecast" : "text-fg-3"}`}>
                  SCN-{scenarioId}
                </span>
                <span className="text-xs font-medium text-fg">{scenario.name}</span>
              </div>
              <span className="block text-[11px] leading-4 text-fg-3">{scenario.story}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
