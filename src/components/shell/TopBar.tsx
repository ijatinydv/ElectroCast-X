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
    <header className="h-12 bg-rail border-b border-line flex items-center justify-between px-3 z-20 relative shrink-0">
      {/* LEFT — brand + navigation */}
      <div className="flex items-center gap-3 min-w-0">
        <Button aria-expanded={leftOpen} aria-label={`${leftOpen ? "Close" : "Open"} mission controls`} variant="ghost" size="icon" className="xl:hidden h-8 w-8 text-fg-2 hover:text-fg" onClick={onToggleLeft}>
          <Menu size={16} />
        </Button>

        {/* Brand wordmark */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="flex items-center justify-center w-6 h-6 rounded bg-risk/15 border border-risk/25 text-risk group-hover:bg-risk/25 transition-colors">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M7 1L2 7h4l-1 4 5-6H6l1-4z" fill="currentColor"/>
            </svg>
          </span>
          <span className="font-semibold text-sm tracking-wide text-fg group-hover:text-fg/90 transition-colors">
            ElectroCast<span className="text-observed">-X</span>
          </span>
        </Link>

        <div className="hidden lg:block w-px h-4 bg-line-strong" aria-hidden="true" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div><Chip variant="neutral" className="cursor-help font-mono text-[9px] tracking-widest px-1.5">SIM</Chip></div>
            </TooltipTrigger>
            <TooltipContent>
              <p>All data in this scenario is prepared. No live feeds.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <nav aria-label="Product navigation" className="hidden lg:flex items-center rounded border border-line bg-raised/20 p-0.5 text-xs gap-0.5">
          <Link href="/mission-control" className="rounded px-3 py-1 font-medium bg-raised text-fg border border-line-strong/40">Mission Control</Link>
          <Link href="/how-it-works" className="rounded px-3 py-1 text-fg-2 hover:text-fg hover:bg-raised/60 transition-colors">Pipeline</Link>
          <Link href="/validation" className="rounded px-3 py-1 text-fg-2 hover:text-fg hover:bg-raised/60 transition-colors">Validation</Link>
        </nav>

        <div className="hidden sm:block min-w-0">
          <div className="text-xs font-medium text-fg truncate">{scenarios[scenarioId].name}</div>
          <p className="max-w-56 text-[10px] leading-3.5 text-fg-3 truncate">{scenarios[scenarioId].story}</p>
        </div>
      </div>

      {/* RIGHT — clock, feeds, controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Dual tactical clock */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex items-center gap-1.5 rounded border border-line bg-raised/30 px-2.5 py-1 cursor-help">
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[11px] font-mono font-medium text-fg num">{scenarioTime.ist}</span>
                  <span className="text-[8px] font-mono text-fg-3 tracking-widest mt-0.5">IST</span>
                </div>
                <span className="text-line-strong text-xs mx-0.5">/</span>
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[11px] font-mono text-fg-2 num">{scenarioTime.utc}</span>
                  <span className="text-[8px] font-mono text-fg-3 tracking-widest mt-0.5">UTC</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs font-mono">
              <p>Simulated timeline · Indian Standard Time &amp; UTC</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Live sensor feed cluster */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="hidden md:flex items-center gap-2 rounded border border-line bg-raised/20 px-2.5 py-1 text-xs hover:bg-raised/50 transition-colors focus-visible:outline-none" aria-label="Open sensor health">
                <span className="text-[9px] font-mono text-fg-3 uppercase tracking-widest">FEEDS</span>
                <div className="flex items-center gap-1">
                  {(Object.keys(frame.sensorHealth) as SensorId[]).map((sensor) => <StatusDot key={sensor} status={sensorMask[sensor] ? "offline" : frame.sensorHealth[sensor].status} />)}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent><SensorHealth frame={frame} sensorOff={sensorOff} /></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-1.5">
          <Button
            aria-label={guidedOn ? "Restart guided demo" : "Start guided demo"}
            className="h-7 text-xs px-3 border-observed/25 text-observed hover:bg-observed/10 hover:border-observed/50 transition-all"
            onClick={onGuidedDemo}
            size="sm"
            variant="outline"
          >
            {guidedOn ? "↺ Restart" : "▷ Demo"}
          </Button>

          <PipelineSheet activeStageId={leftOpen ? "masks" : undefined} />

          <Button
            aria-label="Keyboard shortcuts"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-xs font-mono text-fg-3 hover:text-fg hover:bg-raised rounded"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts (?)"
          >
            ?
          </Button>
        </div>

        <Button aria-expanded={rightOpen} aria-label={`${rightOpen ? "Close" : "Open"} storm details`} variant="ghost" size="icon" className="xl:hidden h-8 w-8 text-fg-2 hover:text-fg" onClick={onToggleRight}>
          <PanelRightClose size={16} />
        </Button>
      </div>

      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </header>
  );
}
