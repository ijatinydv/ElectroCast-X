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
    <ul className="flex flex-col" aria-label="Prepared scenarios">
      {(Object.keys(scenarios) as ScenarioId[]).map((scenarioId) => {
        const scenario = scenarios[scenarioId];
        const active = scenarioId === activeScenarioId;

        return (
          <li key={scenarioId}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(scenarioId)}
              className={`w-full border-l-2 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-line-strong ${active ? "border-forecast bg-raised" : "border-transparent hover:bg-raised"}`}
            >
              <span className="block text-sm font-medium text-fg">{scenario.name}</span>
              <span className="mt-0.5 block text-xs leading-4 text-fg-2">{scenario.story}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
