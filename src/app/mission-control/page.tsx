"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { m } from "motion/react";
import { MapCanvas } from "@/components/map/MapCanvas";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TopBar, LeftRail, RightRail, BottomDock } from "@/components/shell";
import { SensorBanner } from "@/components/shell/SensorBanner";
import { GuideCaption } from "@/components/shell/GuideCaption";
import { GuideRunner } from "@/lib/guide";
import { initialRailState } from "@/lib/mission-control";
import { useStore } from "@/store/useStore";

// keeps the X-ray and its Three runtime outside the initial Mission Control payload
const XRaySheet = dynamic(() => import("@/components/xray/XRaySheet").then((module) => module.XRaySheet), { ssr: false });

export default function MissionControlPage() {
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);
  const guideRunnerRef = React.useRef<GuideRunner | null>(null);

  // keeps one cancellable guide runner alive across top-bar and caption controls
  const guideRunner = React.useMemo(() => {
    guideRunnerRef.current ??= new GuideRunner(useStore);
    return guideRunnerRef.current;
  }, []);

  // lets Escape halt the guide even when focus is inside an overlay sheet
  React.useEffect(() => {
    const stopGuideOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") guideRunner.stop();
    };
    window.addEventListener("keydown", stopGuideOnEscape);
    return () => {
      window.removeEventListener("keydown", stopGuideOnEscape);
      guideRunner.stop();
    };
  }, [guideRunner]);

  // synchronizes rail visibility to the layout breakpoint after the server-safe desktop shell hydrates
  const [isDesktop, setIsDesktop] = React.useState(true);
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const syncViewport = (nextDesktop: boolean) => {
      setIsDesktop(nextDesktop);
      const rails = initialRailState(nextDesktop);
      setLeftOpen(rails.leftOpen);
      setRightOpen(rails.rightOpen);
    };
    syncViewport(mediaQuery.matches);
    const handler = (event: MediaQueryListEvent) => syncViewport(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // keeps a mobile sheet from opening behind the sheet an operator has just selected
  const toggleLeftRail = () => {
    setLeftOpen((open) => !open);
    if (!isDesktop) setRightOpen(false);
  };

  // keeps a mobile sheet from opening behind the sheet an operator has just selected
  const toggleRightRail = () => {
    setRightOpen((open) => !open);
    if (!isDesktop) setLeftOpen(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-bg text-fg">
      <TopBar 
        onGuidedDemo={() => void guideRunner.run()}
        onToggleLeft={toggleLeftRail}
        onToggleRight={toggleRightRail}
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
          <Sheet open={leftOpen && !isDesktop} onOpenChange={(open) => { setLeftOpen(open); if (open) setRightOpen(false); }}>
            <SheetContent side="left" className="w-[264px] p-0 bg-rail border-r border-line sm:max-w-none">
              <SheetTitle className="sr-only">Left Rail</SheetTitle>
              <LeftRail />
            </SheetContent>
          </Sheet>
        )}

        <div id="map-slot" className="flex-1 bg-bg relative overflow-hidden h-full">
          <MapCanvas />
          <SensorBanner />
          <XRaySheet />
          <GuideCaption onStop={() => guideRunner.stop()} />
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
          <Sheet open={rightOpen && !isDesktop} onOpenChange={(open) => { setRightOpen(open); if (open) setLeftOpen(false); }}>
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
