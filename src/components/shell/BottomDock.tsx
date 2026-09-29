"use client";
import * as React from "react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useStore } from "@/store/useStore";
import type { Scenario, TimelineEvent } from "@/types/scenario";
import type { ScenarioId } from "@/types/store";

// resolves static scenario fixtures without a runtime data request
const scenarios = { A: scenarioA, B: scenarioB, C: scenarioC } as unknown as Record<ScenarioId, Scenario>;

// records the full signed minute span displayed by the dock
const MINUTE_RANGE = 120;

// turns the shared scenario clock into the dock's compact signed timecode
function formatTimecode(timeMin: number): string {
  if (timeMin === 0) return "NOW";
  const sign = timeMin < 0 ? "−" : "+";
  return `${sign}${Math.abs(Math.round(timeMin)).toString().padStart(2, "0")}:00`;
}

// maps a scenario minute to the fixed bounds of the time-machine track
function trackPercent(timeMin: number): number {
  return ((Math.min(60, Math.max(-60, timeMin)) + 60) / MINUTE_RANGE) * 100;
}

// returns the adjacent prepared frame so stepping never lands between scenario snapshots
function steppedFrame(frameTimes: readonly number[], timeMin: number, direction: -1 | 1): number {
  if (direction === 1) return frameTimes.find((frameTime) => frameTime > timeMin) ?? 60;
  return [...frameTimes].reverse().find((frameTime) => frameTime < timeMin) ?? -60;
}

// combines authored timeline events with operator warnings from the shared state
function dockEvents(events: readonly TimelineEvent[], issuedWarnings: readonly { tMin: number; cellId: string; horizon: 15 | 30 | 60 }[]): TimelineEvent[] {
  return [
    ...events,
    ...issuedWarnings.map((warning) => ({
      tMin: warning.tMin,
      type: "warningIssued" as const,
      label: `Warning issued for ${warning.cellId}, ${warning.horizon}-minute horizon`,
    })),
  ];
}

// defines the state and data passed into the custom timeline control
interface ScrubberProps {
  events: readonly TimelineEvent[];
  frameTimes: readonly number[];
  timeMin: number;
  onScrub: (timeMin: number) => void;
}

// provides direct pointer control over the shared scenario clock without a slider dependency
function Scrubber({ events, frameTimes, timeMin, onScrub }: ScrubberProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);

  const timeAtPointer = React.useCallback((clientX: number) => {
    const bounds = trackRef.current?.getBoundingClientRect();
    if (!bounds) return timeMin;
    const fraction = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
    return Math.round(fraction * MINUTE_RANGE - 60);
  }, [timeMin]);

  const finishDrag = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return (
    <div className="relative h-10 flex-1 min-w-0 select-none" ref={trackRef}>
      <div
        aria-label="Scenario time scrubber"
        aria-valuemax={60}
        aria-valuemin={-60}
        aria-valuenow={Math.round(timeMin)}
        className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 touch-none cursor-ew-resize"
        onPointerDown={(event) => {
          draggingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          onScrub(timeAtPointer(event.clientX));
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) onScrub(timeAtPointer(event.clientX));
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        role="slider"
        tabIndex={0}
      >
        <div className="absolute inset-x-0 top-1/2 flex h-1 -translate-y-1/2 overflow-hidden rounded-full bg-line">
          <div className="w-1/2 bg-observed" />
          <div className="w-1/2 bg-forecast" />
        </div>
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 bg-fg" />
        <span aria-hidden="true" className="absolute left-1/2 top-0 -translate-x-1/2 text-[9px] font-medium text-fg-2">NOW</span>
        {frameTimes.map((frameTime) => (
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-rail"
            key={frameTime}
            style={{ left: `${trackPercent(frameTime)}%` }}
          />
        ))}
        <TooltipProvider delayDuration={150}>
          {events.map((event, index) => (
            <Tooltip key={`${event.type}-${event.tMin}-${index}`}>
              <TooltipTrigger asChild>
                <button
                  aria-label={`${event.label}, ${formatTimecode(event.tMin)}`}
                  className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rail bg-risk focus-visible:outline-none"
                  onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
                  style={{ left: `${trackPercent(event.tMin)}%` }}
                  type="button"
                />
              </TooltipTrigger>
              <TooltipContent>{event.label} · {formatTimecode(event.tMin)}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        <span aria-hidden="true" className="absolute left-0 top-1/2 w-full" style={{ transform: `translateX(${trackPercent(timeMin)}%)` }}>
          <span className="absolute left-0 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-fg bg-bg shadow-none" />
        </span>
      </div>
    </div>
  );
}

// coordinates scenario playback controls and the timeline surface in the mission-control shell
export function BottomDock() {
  const scenarioId = useStore((state) => state.scenarioId);
  const timeMin = useStore((state) => state.timeMin);
  const playing = useStore((state) => state.playing);
  const speed = useStore((state) => state.speed);
  const issuedWarnings = useStore((state) => state.issuedWarnings);
  const setTime = useStore((state) => state.setTime);
  const setPlaying = useStore((state) => state.setPlaying);
  const setSpeed = useStore((state) => state.setSpeed);
  const compareOn = useStore((state) => state.compare.on);
  const setCompare = useStore((state) => state.setCompare);
  const scenario = scenarios[scenarioId];
  const frameTimes = React.useMemo(() => scenario.frames.map((frame) => frame.t), [scenario]);

  const scrubTo = React.useCallback((nextTime: number) => {
    setPlaying(false);
    setTime(nextTime);
  }, [setPlaying, setTime]);
  const step = React.useCallback((direction: -1 | 1) => {
    setPlaying(false);
    setTime(steppedFrame(frameTimes, timeMin, direction));
  }, [frameTimes, setPlaying, setTime, timeMin]);
  const togglePlayback = React.useCallback(() => setPlaying(!playing), [playing, setPlaying]);
  const replay = React.useCallback(() => {
    setTime(-60);
    setPlaying(true);
  }, [setPlaying, setTime]);

  useHotkeys({ onTogglePlayback: togglePlayback, onStepBackward: () => step(-1), onStepForward: () => step(1) });

  return (
    <section aria-label="Storm Time Machine" className="h-28 border-t border-line bg-rail px-4 py-2 relative z-20">
      <div className="flex h-full items-center gap-3">
        <div className="flex shrink-0 items-center gap-1">
          <Button aria-label="Replay from minus 60 minutes" className="h-8 px-2 text-xs" onClick={replay} variant="ghost">
            <RotateCcw size={14} /> Replay
          </Button>
          <div className="flex items-center rounded-md border border-line p-0.5">
            <Button aria-label="Previous frame" className="size-7" onClick={() => step(-1)} size="icon" variant="ghost"><SkipBack size={14} /></Button>
            <Button aria-label={playing ? "Pause playback" : "Play playback"} className="size-7" onClick={togglePlayback} size="icon" variant="ghost">
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <Button aria-label="Next frame" className="size-7" onClick={() => step(1)} size="icon" variant="ghost"><SkipForward size={14} /></Button>
          </div>
        </div>
        <output aria-live="off" className="num w-14 shrink-0 text-xs text-fg-2">{formatTimecode(timeMin)}</output>
        <Scrubber events={dockEvents(scenario.events, issuedWarnings)} frameTimes={frameTimes} onScrub={scrubTo} timeMin={timeMin} />
        <div aria-label="Playback speed" className="flex shrink-0 rounded-md border border-line p-0.5">
          {([1, 2, 4] as const).map((option) => (
            <Button aria-pressed={speed === option} className="h-7 min-w-8 px-1 text-xs num" key={option} onClick={() => setSpeed(option)} variant={speed === option ? "secondary" : "ghost"}>
              {option}×
            </Button>
          ))}
        </div>
        <div className="hidden shrink-0 sm:block">
          <Button aria-pressed={compareOn} onClick={() => setCompare({ on: !compareOn })} size="sm" variant={compareOn ? "secondary" : "outline"} className="h-8 text-xs">
            Prediction / Actual
          </Button>
        </div>
      </div>
    </section>
  );
}
