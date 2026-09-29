"use client";

import * as React from "react";
import Link from "next/link";
import pipeline from "@/data/content/pipeline.json";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type PipelineItem = (typeof pipeline.sources)[number] | (typeof pipeline.stages)[number];

interface PipelineDiagramProps {
  variant?: "full" | "compact";
  activeStageId?: string;
}

interface PipelineSheetProps {
  activeStageId?: string;
}

const sourcePositions = [
  { x: 36, y: 76 },
  { x: 36, y: 180 },
  { x: 36, y: 284 },
  { x: 36, y: 388 },
];

const stagePositions = [
  { x: 220, y: 208 },
  { x: 400, y: 208 },
  { x: 580, y: 208 },
  { x: 760, y: 208 },
  { x: 940, y: 208 },
  { x: 1120, y: 208 },
];

const outputPositions = [
  { x: 1300, y: 92 },
  { x: 1300, y: 208 },
  { x: 1300, y: 324 },
];

const beamRoute = [
  { x: 176, y: 76 },
  { x: 220, y: 240 },
  { x: 356, y: 240 },
  { x: 400, y: 240 },
  { x: 536, y: 240 },
  { x: 580, y: 240 },
  { x: 716, y: 240 },
  { x: 760, y: 240 },
  { x: 896, y: 240 },
  { x: 940, y: 240 },
  { x: 1076, y: 240 },
  { x: 1120, y: 240 },
  { x: 1256, y: 240 },
  { x: 1300, y: 208 },
];

// maps the shared beam clock onto the flow route without triggering React renders
function pointOnRoute(progress: number) {
  const segments = beamRoute.slice(1).map((point, index) => {
    const start = beamRoute[index]!;
    return { start, end: point, length: Math.hypot(point.x - start.x, point.y - start.y) };
  });
  const totalLength = segments.reduce((total, segment) => total + segment.length, 0);
  let remaining = progress * totalLength;

  for (const segment of segments) {
    if (remaining <= segment.length) {
      const ratio = remaining / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
      };
    }
    remaining -= segment.length;
  }

  return beamRoute.at(-1)!;
}

// renders the content-driven technical flow in either route or operational sheet context
export function PipelineDiagram({ variant = "full", activeStageId }: PipelineDiagramProps) {
  const items = [...pipeline.sources, ...pipeline.stages] as PipelineItem[];
  const initialItem = items.find((item) => item.id === activeStageId) ?? pipeline.stages[0]!;
  const [selectedId, setSelectedId] = React.useState(initialItem.id);
  const beamRef = React.useRef<SVGCircleElement>(null);

  React.useEffect(() => {
    const beam = beamRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let startedAt = performance.now();

    const updateBeam = (now: number) => {
      const point = pointOnRoute(((now - startedAt) % 6000) / 6000);
      beam?.setAttribute("cx", point.x.toString());
      beam?.setAttribute("cy", point.y.toString());
      frameId = window.requestAnimationFrame(updateBeam);
    };

    const start = () => {
      if (!document.hidden && !reducedMotion.matches && !frameId) {
        startedAt = performance.now();
        frameId = window.requestAnimationFrame(updateBeam);
      }
    };

    const stop = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const onVisibilityChange = () => (document.hidden ? stop() : start());
    const onMotionChange = () => (reducedMotion.matches ? stop() : start());
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onMotionChange);
    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  const isCompact = variant === "compact";
  const focusedId = isCompact && activeStageId ? activeStageId : selectedId;
  const selectedItem = items.find((item) => item.id === focusedId) ?? initialItem;

  return (
    <section className={isCompact ? "space-y-3" : "space-y-6"} aria-label="ElectroCast-X forecast pipeline">
      {!isCompact && (
        <div className="max-w-2xl space-y-2">
          <p className="text-sm text-fg-2">Technical flow</p>
          <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">How ElectroCast-X builds a lightning nowcast</h1>
          <p className="max-w-xl text-base leading-6 text-fg-2">Prepared multimodal observations move through a calibrated, physics-guided forecast pipeline before reaching Mission Control.</p>
        </div>
      )}

      <div className="overflow-x-auto border border-line bg-rail p-3 sm:p-5">
        <svg viewBox="0 0 1580 480" className={isCompact ? "min-w-[860px]" : "min-w-[1160px]"} role="img" aria-labelledby="pipeline-svg-title pipeline-svg-description">
          <title id="pipeline-svg-title">ElectroCast-X lightning nowcast pipeline</title>
          <desc id="pipeline-svg-description">Four observation sources flow through quality control, masks, electrification features, forecasting, calibration, and operational outputs.</desc>
          <defs>
            <marker id="pipeline-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--color-line-strong)" />
            </marker>
            <filter id="pipeline-beam-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {sourcePositions.map((position) => <path key={`source-line-${position.y}`} d={`M ${position.x + 140} ${position.y + 32} L 220 240`} fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" markerEnd="url(#pipeline-arrow)" />)}
          {stagePositions.slice(0, -1).map((position) => <path key={`stage-line-${position.x}`} d={`M ${position.x + 136} 240 L ${position.x + 180} 240`} fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" markerEnd="url(#pipeline-arrow)" />)}
          {outputPositions.map((position) => <path key={`output-line-${position.y}`} d={`M 1256 240 L ${position.x} ${position.y + 32}`} fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" markerEnd="url(#pipeline-arrow)" />)}

          <polyline points={beamRoute.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="var(--color-forecast)" strokeOpacity="0.24" strokeWidth="3" />
          <circle ref={beamRef} cx="176" cy="76" r="6" fill="var(--color-observed)" filter="url(#pipeline-beam-glow)" />

          {pipeline.sources.map((source, index) => <PipelineNode key={source.id} item={source} position={sourcePositions[index]!} selected={focusedId === source.id} onSelect={setSelectedId} />)}
          {pipeline.stages.slice(0, -1).map((stage, index) => <PipelineNode key={stage.id} item={stage} position={stagePositions[index]!} selected={focusedId === stage.id} onSelect={setSelectedId} />)}
          {pipeline.stages.at(-1) && <PipelineNode item={pipeline.stages.at(-1)!} position={{ x: 1300, y: 208 }} selected={focusedId === "outputs"} onSelect={setSelectedId} />}
          {pipeline.stages.at(-1) && outputPositions.map((position, index) => <OutputLabel key={position.y} label={["Risk corridors", "Evidence", "Alerts"][index]!} position={position} />)}
        </svg>
      </div>

      <div className="border-l-2 border-forecast bg-raised px-4 py-3" aria-live="polite">
        <p className="text-sm font-medium text-fg">{selectedItem.title}</p>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-fg-2">{selectedItem.explanation}</p>
        <Link href={selectedItem.href} className="mt-3 inline-flex text-sm font-medium text-fg underline underline-offset-4">See it in Mission Control: {selectedItem.feature}</Link>
      </div>
    </section>
  );
}

interface PipelineNodeProps {
  item: PipelineItem;
  position: { x: number; y: number };
  selected: boolean;
  onSelect: (id: string) => void;
}

// makes every flow stage keyboard discoverable while keeping SVG as the diagram surface
function PipelineNode({ item, position, selected, onSelect }: PipelineNodeProps) {
  const kind = "kind" in item ? item.kind : "source";
  const colour = kind === "source" ? "var(--color-observed)" : kind === "output" ? "var(--color-risk)" : "var(--color-forecast)";

  return (
    <g transform={`translate(${position.x} ${position.y})`} role="button" tabIndex={0} aria-pressed={selected} aria-label={`${item.title}. ${item.explanation}`} onMouseEnter={() => onSelect(item.id)} onFocus={() => onSelect(item.id)} onClick={() => onSelect(item.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(item.id); } }} className="cursor-pointer focus:outline-none">
      <rect width="140" height="64" rx="6" fill="var(--color-raised)" stroke={colour} strokeOpacity={selected ? "1" : "0.55"} strokeWidth={selected ? "2" : "1"} />
      <rect width="4" height="64" rx="2" fill={colour} />
      <text x="14" y="24" fill="var(--color-fg)" fontSize="13" fontWeight="600">{truncate(item.title, 21)}</text>
      <text x="14" y="45" fill="var(--color-fg-2)" fontSize="11">{kind === "source" ? "Observed input" : kind === "output" ? "Operator output" : "Forecast stage"}</text>
    </g>
  );
}

interface OutputLabelProps {
  label: string;
  position: { x: number; y: number };
}

// labels the individual operational artifacts produced by the final output stage
function OutputLabel({ label, position }: OutputLabelProps) {
  return <text x={position.x + 154} y={position.y + 37} fill="var(--color-risk)" fontSize="13" fontWeight="600">{label}</text>;
}

// keeps stage labels readable within fixed technical diagram nodes
function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

// provides the compact operational context view without loading a separate diagram implementation
export function PipelineSheet({ activeStageId }: PipelineSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">Pipeline</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto border-line bg-rail px-4 pb-6 pt-4 sm:px-6">
        <SheetHeader className="mx-auto w-full max-w-6xl text-left">
          <SheetTitle>Forecast pipeline</SheetTitle>
          <SheetDescription>Current operational context is highlighted in the technical flow.</SheetDescription>
        </SheetHeader>
        <div className="mx-auto mt-5 w-full max-w-6xl">
          <PipelineDiagram key={activeStageId ?? "default"} variant="compact" activeStageId={activeStageId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
