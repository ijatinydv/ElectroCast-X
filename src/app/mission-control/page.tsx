"use client";
import * as React from "react";
import { m } from "motion/react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TopBar, LeftRail, RightRail, BottomDock } from "@/components/shell";
import { MapCanvas } from "@/components/map/MapCanvas";

export default function MissionControlPage() {
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);
  // Use a standard matching media query logic, handling SSR by waiting for mount
  const [isDesktop, setIsDesktop] = React.useState(true);
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    setIsDesktop(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-bg text-fg">
      <TopBar 
        onToggleLeft={() => setLeftOpen(!leftOpen)} 
        onToggleRight={() => setRightOpen(!rightOpen)} 
        leftOpen={leftOpen} 
        rightOpen={rightOpen} 
      />
      
      <div className="flex-1 flex overflow-hidden relative">
        {isDesktop ? (
          <m.div
            initial={false}
            animate={{ width: leftOpen ? 264 : 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="flex-shrink-0 overflow-hidden relative z-10"
          >
            <div className="w-[264px] h-full absolute top-0 right-0">
              <LeftRail />
            </div>
          </m.div>
        ) : (
          <Sheet open={leftOpen && !isDesktop} onOpenChange={setLeftOpen}>
            <SheetContent side="left" className="w-[264px] p-0 bg-rail border-r border-line sm:max-w-none">
              <SheetTitle className="sr-only">Left Rail</SheetTitle>
              <LeftRail />
            </SheetContent>
          </Sheet>
        )}

        {/* Map Slot */}
        <div id="map-slot" className="flex-1 bg-bg relative overflow-hidden h-full">
          <MapCanvas />
        </div>

        {isDesktop ? (
          <m.div
            initial={false}
            animate={{ width: rightOpen ? 336 : 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="flex-shrink-0 overflow-hidden relative z-10"
          >
            <div className="w-[336px] h-full absolute top-0 left-0">
              <RightRail />
            </div>
          </m.div>
        ) : (
          <Sheet open={rightOpen && !isDesktop} onOpenChange={setRightOpen}>
            <SheetContent side="right" className="w-[336px] p-0 bg-rail border-l border-line sm:max-w-none">
              <SheetTitle className="sr-only">Right Rail</SheetTitle>
              <RightRail />
            </SheetContent>
          </Sheet>
        )}
      </div>

      <BottomDock />
    </div>
  );
}
