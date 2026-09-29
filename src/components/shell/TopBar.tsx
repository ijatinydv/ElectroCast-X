"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { StatusDot } from "@/components/ui/StatusDot";
import { SensorHealth } from "@/components/panels/SensorHealth";
import { effectiveSensorMask } from "@/lib/derive";
import { frameAt } from "@/lib/map/interpolate";
import { useStore } from "@/store/useStore";
import type { Scenario, SensorId } from "@/types/scenario";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Menu, PanelRightClose } from "lucide-react";

// keeps prepared scenarios available to the health readout without remote data access
const scenarios: Record<"A" | "B" | "C", Scenario> = { A: scenarioA as unknown as Scenario, B: scenarioB as unknown as Scenario, C: scenarioC as unknown as Scenario };

interface TopBarProps {
  onToggleLeft: () => void;
  onToggleRight: () => void;
  leftOpen: boolean;
  rightOpen: boolean;
}

// keeps the shell status display synchronized with the active scenario time and sensor mask
export function TopBar({ onToggleLeft, onToggleRight, leftOpen, rightOpen }: TopBarProps) {
  const [time, setTime] = React.useState(new Date());
  const scenarioId = useStore((state) => state.scenarioId);
  const timeMin = useStore((state) => state.timeMin);
  const sensorOff = useStore((state) => state.sensorOff);
  const frame = frameAt(scenarios[scenarioId], timeMin);
  const sensorMask = effectiveSensorMask(sensorOff, frame.sensorHealth);
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const istFormatter = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  const utcFormatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });

  return (
    <header className="h-12 bg-rail border-b border-line flex items-center justify-between px-4 z-20 relative">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="xl:hidden h-8 w-8" onClick={onToggleLeft}>
          <Menu size={16} />
        </Button>
        <div className="font-semibold text-fg tracking-wide">ElectroCast-X</div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div><Chip variant="alert" className="cursor-help">SIMULATED</Chip></div>
            </TooltipTrigger>
            <TooltipContent>
              <p>All data in this scenario is prepared. No live feeds.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="text-sm text-fg-2 hidden sm:block">{scenarios[scenarioId].name}</div>
      </div>

      <div className="flex items-center gap-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="text-sm font-mono num text-fg flex items-center gap-1">
                IST {istFormatter.format(time)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>UTC {utcFormatter.format(time)}</p>
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

        <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
          Guided demo
        </Button>

        <Button variant="ghost" size="icon" className="xl:hidden h-8 w-8" onClick={onToggleRight}>
          <PanelRightClose size={16} />
        </Button>
      </div>
    </header>
  );
}
