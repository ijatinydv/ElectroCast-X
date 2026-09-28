"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { StatusDot } from "@/components/ui/StatusDot";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Menu, PanelRightClose } from "lucide-react";

interface TopBarProps {
  onToggleLeft: () => void;
  onToggleRight: () => void;
  leftOpen: boolean;
  rightOpen: boolean;
}

export function TopBar({ onToggleLeft, onToggleRight, leftOpen, rightOpen }: TopBarProps) {
  const [time, setTime] = React.useState(new Date());
  
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

        <div className="text-sm text-fg-2 hidden sm:block">Scenario A: Developing Cell</div>
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

        <div className="flex items-center gap-2 hidden md:flex">
          <StatusDot status="online" title="Radar" />
          <StatusDot status="online" title="INSAT" />
          <StatusDot status="online" title="Lightning network" />
          <StatusDot status="online" title="NWP" />
        </div>

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
