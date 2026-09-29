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
export function steppedFrame(frameTimes: readonly number[], timeMin: number, direction: -1 | 1): number {
  if (direction === 1) return frameTimes.find((frameTime) => frameTime > timeMin) ?? 60;
  return [...frameTimes].reverse().find((frameTime) => frameTime < timeMin) ?? -60;
}

// maps documented slider keys to shared scenario timeline frame positions
export function scrubberKeyTime(frameTimes: readonly number[], timeMin: number, key: string): number | null {
  if (key === "ArrowLeft") return steppedFrame(frameTimes, timeMin, -1);
  if (key === "ArrowRight") return steppedFrame(frameTimes, timeMin, 1);
  if (key === "Home") return frameTimes[0] ?? -60;
  if (key === "End") return frameTimes.at(-1) ?? 60;
  if (key === "PageUp") return steppedFrame(frameTimes, steppedFrame(frameTimes, timeMin, 1), 1);
  if (key === "PageDown") return steppedFrame(frameTimes, steppedFrame(frameTimes, timeMin, -1), -1);
  return null;
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

  const majorTicks = [-60, -30, 0, 30, 60] as const;

  return (
    <div className="relative h-14 flex-1 min-w-0 select-none flex flex-col justify-center" ref={trackRef}>
      {/* Top track labels: Observed vs Forecast */}
      <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 px-0.5 text-fg-3">
        <span className="flex items-center gap-1.5 text-observed/90">
          <span className="size-1.5 rounded-full bg-observed" />
          OBSERVED RADAR &amp; SATELLITE
        </span>
        <span className="flex items-center gap-1.5 text-forecast/90">
          NOWCAST EXTRAPOLATION
          <span className="size-1.5 rounded-full bg-forecast" />
        </span>
      </div>

      <div
        aria-label="Scenario time scrubber"
        aria-valuemax={60}
        aria-valuemin={-60}
        aria-valuenow={Math.round(timeMin)}
        aria-valuetext={formatTimecode(timeMin)}
        className="relative h-8 touch-none cursor-ew-resize"
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
        onKeyDown={(event) => {
          const nextTime = scrubberKeyTime(frameTimes, timeMin, event.key);
          if (nextTime === null) return;
          event.preventDefault();
          onScrub(nextTime);
        }}
        role="slider"
        tabIndex={0}
      >
        {/* Track Bar with Dual Spectrum */}
        <div className="absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 overflow-hidden rounded border border-line bg-line">
          <div className="w-1/2 bg-observed/70 hover:bg-observed transition-colors" />
          <div className="w-1/2 bg-forecast/70 hover:bg-forecast transition-colors" />
        </div>

        {/* Vernier Major Ticks and Time Labels */}
        {majorTicks.map((t) => (
          <div
            key={t}
            aria-hidden="true"
            className="absolute top-1/2 -translate-x-1/2 pointer-events-none"
            style={{ left: `${trackPercent(t)}%` }}
          >
            <div className={`w-px -translate-y-1/2 ${t === 0 ? "h-6 bg-fg" : "h-3.5 bg-line-strong"}`} />
            <span className={`absolute top-2.5 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap ${t === 0 ? "text-fg font-semibold" : "text-fg-3"}`}>
              {t === 0 ? "NOW" : `${t > 0 ? "+" : ""}${t}m`}
            </span>
          </div>
        ))}

        {/* Prepared frame snap tick marks */}
        {frameTimes.map((frameTime) => (
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-rail/80 pointer-events-none"
            key={frameTime}
            style={{ left: `${trackPercent(frameTime)}%` }}
          />
        ))}

        {/* Event Milestone Beads */}
        <TooltipProvider delayDuration={150}>
          {events.map((event, index) => (
            <Tooltip key={`${event.type}-${event.tMin}-${index}`}>
              <TooltipTrigger asChild>
                <button
                  aria-label={`${event.label}, ${formatTimecode(event.tMin)}`}
                  className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bg bg-risk shadow-sm hover:scale-125 focus-visible:outline-none transition-transform z-10"
                  onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
                  style={{ left: `${trackPercent(event.tMin)}%` }}
                  type="button"
                />
              </TooltipTrigger>
              <TooltipContent className="bg-rail border border-line text-xs font-mono">
                {event.label} · {formatTimecode(event.tMin)}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        {/* Tactical Needle Scrubber Handle */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full pointer-events-none"
          style={{ transform: `translateX(${trackPercent(timeMin)}%)` }}
        >
          <div className="absolute left-0 top-0 h-full w-px -translate-x-1/2 bg-fg shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
          <span className="absolute left-0 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-fg bg-bg shadow-md" />
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
    <section aria-label="Storm Time Machine" className="border-t border-line bg-rail px-4 py-2 relative z-20" style={{ height: 96 }}>
      {/* Header strip */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-observed opacity-70" />
              <span className="relative inline-flex rounded-full size-1.5 bg-observed" />
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-fg-3">Storm Time Machine</span>
          </span>
        </div>
        <div className="hidden sm:block">
          <button
            aria-pressed={compareOn}
            onClick={() => setCompare({ on: !compareOn })}
            className={`h-6 px-3 text-[10px] font-mono uppercase tracking-wider rounded border transition-all ${
              compareOn
                ? "border-forecast/50 text-forecast bg-forecast/10 hover:bg-forecast/15"
                : "border-line text-fg-3 hover:text-fg hover:border-line-strong"
            }`}
          >
            {compareOn ? "◈ Compare: ON" : "◇ Compare"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Transport cluster */}
        <div className="flex shrink-0 items-center gap-1">
          <Button aria-label="Replay from minus 60 minutes" className="h-7 w-7 text-fg-3 hover:text-fg" onClick={replay} size="icon" variant="ghost" title="Replay">
            <RotateCcw size={13} />
          </Button>
          <div className="flex items-center rounded border border-line bg-raised/40 p-0.5">
            <Button aria-label="Previous frame" className="size-7 text-fg-2 hover:text-fg" onClick={() => step(-1)} size="icon" variant="ghost">
              <SkipBack size={13} />
            </Button>
            <Button
              aria-label={playing ? "Pause playback" : "Play playback"}
              className={`size-7 ${playing ? "text-risk" : "text-observed"}`}
              onClick={togglePlayback}
              size="icon"
              variant="ghost"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <Button aria-label="Next frame" className="size-7 text-fg-2 hover:text-fg" onClick={() => step(1)} size="icon" variant="ghost">
              <SkipForward size={13} />
            </Button>
          </div>
        </div>

        {/* Timecode */}
        <output
          aria-live="off"
          className="num w-14 shrink-0 text-xs font-bold text-fg bg-raised/60 px-1.5 py-1.5 rounded border border-line text-center tracking-tight"
        >
          {formatTimecode(timeMin)}
        </output>

        {/* Timeline track */}
        <Scrubber events={dockEvents(scenario.events, issuedWarnings)} frameTimes={frameTimes} onScrub={scrubTo} timeMin={timeMin} />

        {/* Speed cluster */}
        <div aria-label="Playback speed" className="flex shrink-0 rounded border border-line bg-raised/30 p-0.5">
          {([1, 2, 4] as const).map((option) => (
            <Button
              aria-pressed={speed === option}
              className={`h-6 min-w-7 px-1.5 text-[10px] num font-mono ${
                speed === option
                  ? "bg-raised text-fg border border-line-strong/50"
                  : "text-fg-3 hover:text-fg"
              }`}
              key={option}
              onClick={() => setSpeed(option)}
              variant="ghost"
            >
              {option}×
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
