"use client";
import * as React from "react";
import { Play, Pause, SkipBack, SkipForward, FastForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BottomDock() {
  return (
    <div className="h-24 bg-rail border-t border-line flex flex-col px-4 py-2 z-20 relative">
      <div className="flex-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8"><RotateCcw size={16} /></Button>
          <div className="flex items-center gap-1 border border-line rounded-md p-1">
            <Button variant="ghost" size="icon" className="h-6 w-6"><SkipBack size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6"><Play size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6"><SkipForward size={14} /></Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8"><FastForward size={16} /></Button>
        </div>
        
        <div className="flex-1 px-8 relative flex items-center h-full">
          {/* Track placeholder */}
          <div className="absolute left-8 right-8 h-1 bg-line rounded-full flex">
            <div className="w-1/2 h-full bg-observed rounded-l-full"></div>
            <div className="w-1/2 h-full bg-forecast rounded-r-full"></div>
          </div>
          <div className="absolute left-1/2 -ml-px w-0.5 h-3 bg-fg top-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-fg-3">−60:00</span>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
            Prediction / Actual
          </Button>
        </div>
      </div>
    </div>
  );
}
