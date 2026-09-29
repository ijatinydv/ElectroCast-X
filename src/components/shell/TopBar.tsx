"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { StatusDot } from "@/components/ui/StatusDot";
import { SensorHealth } from "@/components/panels/SensorHealth";
import { effectiveSensorMask, formatScenarioTime } from "@/lib/derive";
import { frameAt } from "@/lib/map/interpolate";
import { useStore } from "@/store/useStore";
import type { Scenario, SensorId } from "@/types/scenario";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PipelineSheet } from "@/components/pipeline/PipelineDiagram";
import { Menu, PanelRightClose } from "lucide-react";

import { KeyboardShortcutsModal } from "@/components/shell/KeyboardShortcutsModal";
import { useHotkeys } from "@/hooks/useHotkeys";

// keeps prepared scenarios available to the health readout without remote data access
const scenarios: Record<"A" | "B" | "C", Scenario> = { A: scenarioA as unknown as Scenario, B: scenarioB as unknown as Scenario, C: scenarioC as unknown as Scenario };

interface TopBarProps {
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onGuidedDemo: () => void;
  leftOpen: boolean;
  rightOpen: boolean;
}

// keeps scenario health, operational controls, and pipeline context accessible from Mission Control
export function TopBar({ onToggleLeft, onToggleRight, onGuidedDemo, leftOpen, rightOpen }: TopBarProps) {
  const scenarioId = useStore((state) => state.scenarioId);
  const timeMin = useStore((state) => state.timeMin);
  const sensorOff = useStore((state) => state.sensorOff);
  const guidedOn = useStore((state) => state.guided.on);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const frame = frameAt(scenarios[scenarioId], timeMin);
  const sensorMask = effectiveSensorMask(sensorOff, frame.sensorHealth);
  const scenarioTime = formatScenarioTime(scenarios[scenarioId], timeMin);

  useHotkeys({
    onSelectScenarioA: () => useStore.getState().selectScenario("A"),
    onSelectScenarioB: () => useStore.getState().selectScenario("B"),
    onSelectScenarioC: () => useStore.getState().selectScenario("C"),
    onToggleXRay: () => {
      const current = useStore.getState().panels.xray;
      useStore.getState().setPanel("xray", !current);
    },
    onToggleAlert: () => {
      const current = useStore.getState().panels.alert;
      useStore.getState().setPanel("alert", !current);
    },
    onToggleCompare: () => {
      const current = useStore.getState().compare.on;
      useStore.getState().setCompare({ on: !current });
    },
    onToggleGuide: () => {
      onGuidedDemo();
    },
    onToggleShortcuts: () => setShortcutsOpen((open) => !open),
  });

  return (
    <header className="h-12 bg-rail border-b border-line flex items-center justify-between px-4 z-20 relative">
      <div className="flex items-center gap-4">
        <Button aria-expanded={leftOpen} aria-label={`${leftOpen ? "Close" : "Open"} mission controls`} variant="ghost" size="icon" className="xl:hidden h-8 w-8" onClick={onToggleLeft}>
          <Menu size={16} />
        </Button>
        <Link href="/" className="font-semibold text-fg tracking-wide hover:text-fg-2 transition-colors">ElectroCast-X</Link>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div><Chip variant="neutral" className="cursor-help">SIMULATED</Chip></div>
            </TooltipTrigger>
            <TooltipContent>
              <p>All data in this scenario is prepared. No live feeds.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <nav aria-label="Product navigation" className="hidden lg:flex items-center rounded-md border border-line bg-raised/40 p-0.5 text-xs">
          <Link href="/mission-control" className="rounded px-2.5 py-1 font-medium bg-raised text-fg">Mission Control</Link>
          <Link href="/how-it-works" className="rounded px-2.5 py-1 text-fg-2 hover:text-fg transition-colors">Pipeline</Link>
          <Link href="/validation" className="rounded px-2.5 py-1 text-fg-2 hover:text-fg transition-colors">Validation</Link>
        </nav>

        <div className="hidden sm:block">
          <div className="text-sm text-fg-2">{scenarios[scenarioId].name}</div>
          <p className="max-w-72 text-xs leading-4 text-fg-3">{scenarios[scenarioId].story}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="text-sm font-mono num text-fg flex items-center gap-1">
                IST {scenarioTime.ist}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>UTC {scenarioTime.utc}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="flex items-center gap-2 hidden md:flex focus-visible:outline-none" aria-label="Open sensor health">
                {(Object.keys(frame.sensorHealth) as SensorId[]).map((sensor) => <StatusDot key={sensor} status={sensorMask[sensor] ? "offline" : frame.sensorHealth[sensor].status} />)}
              </button>
            </TooltipTrigger>
            <TooltipContent><SensorHealth frame={frame} sensorOff={sensorOff} /></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-2">
          <Button aria-label={guidedOn ? "Restart guided demo" : "Start guided demo"} className="h-7 text-xs" onClick={onGuidedDemo} size="sm" variant="outline">
            {guidedOn ? "Restart" : "Guided demo"}
          </Button>

          <PipelineSheet activeStageId={leftOpen ? "masks" : undefined} />

          <Button
            aria-label="Keyboard shortcuts"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-xs font-mono text-fg-2 hover:text-fg hover:bg-raised"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts (?)"
          >
            ?
          </Button>
        </div>

        <Button aria-expanded={rightOpen} aria-label={`${rightOpen ? "Close" : "Open"} storm details`} variant="ghost" size="icon" className="xl:hidden h-8 w-8" onClick={onToggleRight}>
          <PanelRightClose size={16} />
        </Button>
      </div>

      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </header>
  );
}
