"use client";

import * as React from "react";
import Link from "next/link";
import pipeline from "@/data/content/pipeline.json";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type PipelineItem = (typeof pipeline.sources)[number] | (typeof pipeline.stages)[number];

export interface PipelineDiagramProps {
  variant?: "full" | "compact";
  activeStageId?: string;
}

export interface PipelineSheetProps {
  activeStageId?: string;
}

interface NodeDetail {
  code: string;
  eyebrow: string;
  line1: string;
  line2: string;
}

const nodeDetails: Record<string, NodeDetail> = {
  radar: {
    code: "STRM-01",
    eyebrow: "POLARIMETRIC DWR",
    line1: "250m radial · 6-10m scan",
    line2: "Z, Z_DR column, K_DP, V_r",
  },
  insat: {
    code: "STRM-02",
    eyebrow: "GEOSTATIONARY IR",
    line1: "10.8 µm thermal IR · 4km",
    line2: "Cloud-top cooling ΔT/Δt",
  },
  "lightning-network": {
    code: "STRM-03",
    eyebrow: "GROUND RF ARRAY",
    line1: "VHF/LF time-of-arrival",
    line2: "IC + CG strike density anchor",
  },
  nwp: {
    code: "STRM-04",
    eyebrow: "MESOSCALE SIMULATION",
    line1: "WRF 3km grid · hourly",
    line2: "CAPE, 0-6km shear, 0°C lvl",
  },
  "quality-control": {
    code: "PROC-01",
    eyebrow: "DETERMINISTIC QC",
    line1: "De-aliasing · clutter filter",
    line2: "Temporal synchronization bus",
  },
  masks: {
    code: "PROC-02",
    eyebrow: "SPATIAL PROJECTION",
    line1: "1 km × 1 km unified grid",
    line2: "Sensor-loss & age mask tensor",
  },
  "temperature-features": {
    code: "PHYS-01",
    eyebrow: "ISOTHERMAL PHYSICS",
    line1: "0°C, −10°C, −20°C layers",
    line2: "Non-inductive graupel charging",
  },
  "forecast-model": {
    code: "CORE-01",
    eyebrow: "SPATIOTEMPORAL TRANSFORMER",
    line1: "Cross-attention temporal fusion",
    line2: "Continuous neural advection v_θ",
  },
  "forecast-heads": {
    code: "HEAD-01",
    eyebrow: "DUAL PREDICTION HEADS",
    line1: "Weibull hazard h(t) survival",
    line2: "Active-storm density regression",
  },
  calibration: {
    code: "CONF-01",
    eyebrow: "CONFORMAL BOUNDS",
    line1: "1−α = 0.90 coverage guarantee",
    line2: "Dynamic corridor dilation",
  },
  outputs: {
    code: "PROD-01",
    eyebrow: "OPERATIONAL DISPATCH",
    line1: "15 / 30 / 60 min lead time",
    line2: "Multi-lingual CAP 1.2 XML",
  },
};

// Continuous circuit beam route along the primary pipeline flow
const circuitRoute = [
  { x: 244, y: 126 },
  { x: 270, y: 126 },
  { x: 270, y: 140 },
  { x: 434, y: 140 },
  { x: 624, y: 140 },
  { x: 762, y: 140 },
  { x: 762, y: 214 },
  { x: 434, y: 214 },
  { x: 434, y: 296 },
  { x: 624, y: 296 },
  { x: 762, y: 296 },
  { x: 762, y: 370 },
  { x: 434, y: 370 },
  { x: 434, y: 452 },
  { x: 640, y: 452 },
  { x: 814, y: 452 },
  { x: 920, y: 452 },
  { x: 920, y: 131 },
  { x: 1060, y: 131 },
  { x: 1060, y: 279 },
  { x: 1060, y: 393 },
  { x: 1060, y: 507 },
];

function pointOnCircuit(progress: number) {
  const segments = circuitRoute.slice(1).map((point, index) => {
    const start = circuitRoute[index]!;
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
  return circuitRoute.at(-1)!;
}

export function PipelineDiagram({ variant = "full", activeStageId }: PipelineDiagramProps) {
  const items = [...pipeline.sources, ...pipeline.stages] as PipelineItem[];
  const initialItem = items.find((item) => item.id === activeStageId) ?? pipeline.stages[0]!;
  const [selectedId, setSelectedId] = React.useState(initialItem.id);
  const beamRef = React.useRef<SVGCircleElement>(null);

  // Preserve Decision D32: Single requestAnimationFrame coordinated with document visibility and reduced motion
  React.useEffect(() => {
    const beam = beamRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let startedAt = performance.now();

    const updateBeam = (now: number) => {
      const point = pointOnCircuit(((now - startedAt) % 6500) / 6500);
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
  const selectedDetail = nodeDetails[selectedItem.id] ?? nodeDetails["quality-control"]!;

  return (
    <section className="space-y-4" aria-label="ElectroCast-X forecast pipeline">
      {!isCompact && (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-forecast font-medium">
              System Blueprint
            </p>
            <h1 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">
              Multimodal Pipeline Architecture
            </h1>
            <p className="text-xs text-fg-2">
              Physics-guided nowcasting flow from raw sensor telemetry to calibrated warning dispatch.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-fg-3">
            <span className="flex items-center gap-1.5 text-observed">
              <span className="h-2 w-2 rounded-full bg-observed inline-block" />
              Observed streams
            </span>
            <span className="flex items-center gap-1.5 text-forecast">
              <span className="h-2 w-2 rounded-full bg-forecast inline-block" />
              AI &amp; physics core
            </span>
            <span className="flex items-center gap-1.5 text-risk">
              <span className="h-2 w-2 rounded-full bg-risk inline-block" />
              Operational outputs
            </span>
          </div>
        </div>
      )}

      {/* Blueprint SVG Canvas */}
      <div className="rounded-lg border border-line bg-[#070b12] p-2 sm:p-4 shadow-2xl overflow-hidden">
        <svg
          viewBox="0 0 1200 600"
          className="w-full h-auto select-none"
          role="img"
          aria-label="ElectroCast-X technical architecture blueprint"
        >
          <defs>
            <marker id="arrow-gray" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--color-line-strong)" />
            </marker>
            <marker id="arrow-cyan" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--color-observed)" />
            </marker>
            <marker id="arrow-violet" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--color-forecast)" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--color-risk)" />
            </marker>
            <filter id="circuit-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* =========================================================================
              SUBSYSTEM 1: OBSERVATION FEEDS / INGESTION (LEFT)
          ========================================================================= */}
          <g>
            <rect x="20" y="20" width="232" height="560" rx="4" fill="#0b101b" fillOpacity="0.6" stroke="var(--color-line)" strokeWidth="1" />
            <text x="36" y="44" fill="var(--color-observed)" fontSize="11" fontFamily="monospace" fontWeight="700" letterSpacing="1">
              OBSERVATION FEEDS / INGESTION
            </text>
            <text x="36" y="58" fill="var(--color-fg-3)" fontSize="9.5" fontFamily="monospace">
              4 streams · sub-second to 15m cadence
            </text>

            <SvgNode
              id="radar"
              title="Doppler radar"
              item={pipeline.sources[0]!}
              detail={nodeDetails.radar!}
              x={36}
              y={72}
              w={200}
              h={110}
              color="var(--color-observed)"
              selected={focusedId === "radar"}
              onSelect={setSelectedId}
            />

            <SvgNode
              id="insat"
              title="INSAT"
              item={pipeline.sources[1]!}
              detail={nodeDetails.insat!}
              x={36}
              y={200}
              w={200}
              h={110}
              color="var(--color-observed)"
              selected={focusedId === "insat"}
              onSelect={setSelectedId}
            />

            <SvgNode
              id="lightning-network"
              title="Lightning network"
              item={pipeline.sources[2]!}
              detail={nodeDetails["lightning-network"]!}
              x={36}
              y={328}
              w={200}
              h={110}
              color="var(--color-observed)"
              selected={focusedId === "lightning-network"}
              onSelect={setSelectedId}
            />

            <SvgNode
              id="nwp"
              title="NWP"
              item={pipeline.sources[3]!}
              detail={nodeDetails.nwp!}
              x={36}
              y={456}
              w={200}
              h={110}
              color="var(--color-observed)"
              selected={focusedId === "nwp"}
              onSelect={setSelectedId}
            />
          </g>

          {/* =========================================================================
              SUBSYSTEM 2: PIPELINE CORE / ML ENGINE (CENTER)
          ========================================================================= */}
          <g>
            <rect x="272" y="20" width="648" height="560" rx="4" fill="#0b101b" fillOpacity="0.6" stroke="var(--color-line)" strokeWidth="1" />
            <text x="290" y="44" fill="var(--color-forecast)" fontSize="11" fontFamily="monospace" fontWeight="700" letterSpacing="1">
              ELECTROCAST-X PIPELINE / ML ENGINE
            </text>
            <text x="290" y="58" fill="var(--color-fg-3)" fontSize="9.5" fontFamily="monospace">
              1 km common grid · continuous-time advection · 5-min synchronous cycle
            </text>

            {/* Tier 1 Label */}
            <text x="290" y="78" fill="var(--color-fg-3)" fontSize="9" fontFamily="monospace" fontWeight="600">
              TIER 1: SPATIOTEMPORAL ALIGNMENT &amp; QC
            </text>

            <SvgNode
              id="quality-control"
              title="Quality control and time alignment"
              item={pipeline.stages[0]!}
              detail={nodeDetails["quality-control"]!}
              x={290}
              y={86}
              w={280}
              h={108}
              color="var(--color-line-strong)"
              selected={focusedId === "quality-control"}
              onSelect={setSelectedId}
            />

            <SvgNode
              id="masks"
              title="Common grid with missing-sensor and data-age masks"
              item={pipeline.stages[1]!}
              detail={nodeDetails.masks!}
              x={620}
              y={86}
              w={280}
              h={108}
              color="var(--color-forecast)"
              selected={focusedId === "masks"}
              onSelect={setSelectedId}
            />

            {/* Tier 2 Label */}
            <text x="290" y="234" fill="var(--color-fg-3)" fontSize="9" fontFamily="monospace" fontWeight="600">
              TIER 2: PHYSICS-GUIDED FORECASTING ENGINE
            </text>

            <SvgNode
              id="temperature-features"
              title="Temperature-coordinate electrification features"
              item={pipeline.stages[2]!}
              detail={nodeDetails["temperature-features"]!}
              x={290}
              y={242}
              w={280}
              h={108}
              color="var(--color-forecast)"
              selected={focusedId === "temperature-features"}
              onSelect={setSelectedId}
            />

            <SvgNode
              id="forecast-model"
              title="Multimodal temporal transformer with neural advection"
              item={pipeline.stages[3]!}
              detail={nodeDetails["forecast-model"]!}
              x={620}
              y={242}
              w={280}
              h={108}
              color="var(--color-forecast)"
              selected={focusedId === "forecast-model"}
              onSelect={setSelectedId}
            />

            {/* Tier 3 Label */}
            <text x="290" y="390" fill="var(--color-fg-3)" fontSize="9" fontFamily="monospace" fontWeight="600">
              TIER 3: DUAL PREDICTION HEADS &amp; CONFORMAL CALIBRATION
            </text>

            <SvgNode
              id="forecast-heads"
              title="First-lightning survival head and Active-storm density head"
              item={pipeline.stages[4]!}
              detail={nodeDetails["forecast-heads"]!}
              x={290}
              y={398}
              w={280}
              h={108}
              color="var(--color-forecast)"
              selected={focusedId === "forecast-heads"}
              onSelect={setSelectedId}
            />

            {/* Decision Diamond: Conformal Coverage Check */}
            <g transform="translate(638, 452)">
              <polygon points="0,-24 34,0 0,24 -34,0" fill="#0d1424" stroke="var(--color-risk)" strokeWidth="1.5" />
              <text x="0" y="-3" fill="var(--color-fg)" fontSize="8" fontFamily="monospace" fontWeight="700" textAnchor="middle">
                COVERAGE
              </text>
              <text x="0" y="8" fill="var(--color-risk)" fontSize="8" fontFamily="monospace" fontWeight="700" textAnchor="middle">
                ≥ 90%?
              </text>
            </g>

            <SvgNode
              id="calibration"
              title="Conformal calibration and uncertainty"
              item={pipeline.stages[5]!}
              detail={nodeDetails.calibration!}
              x={718}
              y={398}
              w={182}
              h={108}
              color="var(--color-risk)"
              selected={focusedId === "calibration"}
              onSelect={setSelectedId}
            />
          </g>

          {/* =========================================================================
              SUBSYSTEM 3: MISSION CONTROL / OPERATIONAL DELIVERY (RIGHT)
          ========================================================================= */}
          <g>
            <rect x="940" y="20" width="240" height="560" rx="4" fill="#0b101b" fillOpacity="0.6" stroke="var(--color-line)" strokeWidth="1" />
            <text x="956" y="44" fill="var(--color-risk)" fontSize="11" fontFamily="monospace" fontWeight="700" letterSpacing="1">
              MISSION CONTROL / DISPATCH
            </text>
            <text x="956" y="58" fill="var(--color-fg-3)" fontSize="9.5" fontFamily="monospace">
              Operator HUD · public early warning
            </text>

            <SvgNode
              id="outputs"
              title="Risk corridors, evidence and alerts"
              item={pipeline.stages[6]!}
              detail={nodeDetails.outputs!}
              x={956}
              y={72}
              w={208}
              h={118}
              color="var(--color-risk)"
              selected={focusedId === "outputs"}
              onSelect={setSelectedId}
            />

            {/* Deliverable 1: Risk Corridors */}
            <g transform="translate(956, 232)">
              <rect width="208" height="94" rx="3" fill="#070b12" stroke="var(--color-risk)" strokeWidth="1" />
              <rect x="0" y="0" width="3" height="94" fill="var(--color-risk)" />
              <text x="12" y="22" fill="var(--color-risk)" fontSize="9" fontFamily="monospace" fontWeight="700">
                OUTPUT PRODUCT 01
              </text>
              <text x="12" y="44" fill="var(--color-fg)" fontSize="12" fontWeight="700">
                Risk corridors
              </text>
              <text x="12" y="64" fill="var(--color-fg-2)" fontSize="10" fontFamily="monospace">
                Dynamic 15/30/60m hulls
              </text>
              <text x="12" y="78" fill="var(--color-fg-3)" fontSize="9.5" fontFamily="monospace">
                Inner 50% &amp; outer 90% bounds
              </text>
            </g>

            {/* Deliverable 2: Evidence */}
            <g transform="translate(956, 346)">
              <rect width="208" height="94" rx="3" fill="#070b12" stroke="var(--color-forecast)" strokeWidth="1" />
              <rect x="0" y="0" width="3" height="94" fill="var(--color-forecast)" />
              <text x="12" y="22" fill="var(--color-forecast)" fontSize="9" fontFamily="monospace" fontWeight="700">
                OUTPUT PRODUCT 02
              </text>
              <text x="12" y="44" fill="var(--color-fg)" fontSize="12" fontWeight="700">
                Evidence
              </text>
              <text x="12" y="64" fill="var(--color-fg-2)" fontSize="10" fontFamily="monospace">
                Physical sensor attribution
              </text>
              <text x="12" y="78" fill="var(--color-fg-3)" fontSize="9.5" fontFamily="monospace">
                Z_DR &amp; cooling rate sparklines
              </text>
            </g>

            {/* Deliverable 3: Alerts */}
            <g transform="translate(956, 460)">
              <rect width="208" height="94" rx="3" fill="#070b12" stroke="var(--color-risk)" strokeWidth="1" />
              <rect x="0" y="0" width="3" height="94" fill="var(--color-risk)" />
              <text x="12" y="22" fill="var(--color-risk)" fontSize="9" fontFamily="monospace" fontWeight="700">
                OUTPUT PRODUCT 03
              </text>
              <text x="12" y="44" fill="var(--color-fg)" fontSize="12" fontWeight="700">
                Alerts
              </text>
              <text x="12" y="64" fill="var(--color-fg-2)" fontSize="10" fontFamily="monospace">
                CAP 1.2 XML &amp; multi-lingual SMS
              </text>
              <text x="12" y="78" fill="var(--color-fg-3)" fontSize="9.5" fontFamily="monospace">
                English, हिन्दी, ଓଡ଼ିଆ broadcasts
              </text>
            </g>
          </g>

          {/* =========================================================================
              ORTHOGONAL CIRCUIT CONNECTORS
          ========================================================================= */}
          {/* Feeds funnel into Stage 1 (Quality control) */}
          <path d="M 236 127 L 264 127 L 264 140 L 288 140" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" markerEnd="url(#arrow-gray)" />
          <path d="M 236 255 L 264 255 L 264 140" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" />
          <path d="M 236 383 L 264 383 L 264 140" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" />
          <path d="M 236 511 L 264 511 L 264 140" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" />

          {/* QC to Masks */}
          <path d="M 570 140 L 618 140" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" markerEnd="url(#arrow-gray)" />

          {/* Masks to Temperature Features (Tier 1 -> Tier 2) */}
          <path d="M 760 194 L 760 216 L 430 216 L 430 240" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" markerEnd="url(#arrow-violet)" />
          <text x="595" y="212" fill="var(--color-fg-3)" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
            multimodal gridded tensor
          </text>

          {/* Temperature Features to Transformer */}
          <path d="M 570 296 L 618 296" fill="none" stroke="var(--color-forecast)" strokeWidth="1.5" markerEnd="url(#arrow-violet)" />

          {/* Transformer to Forecast Heads (Tier 2 -> Tier 3) */}
          <path d="M 760 350 L 760 372 L 430 372 L 430 396" fill="none" stroke="var(--color-forecast)" strokeWidth="1.5" markerEnd="url(#arrow-violet)" />
          <text x="595" y="368" fill="var(--color-fg-3)" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
            spatiotemporal convective memory state
          </text>

          {/* Forecast Heads to Conformal Decision Gate */}
          <path d="M 570 452 L 602 452" fill="none" stroke="var(--color-forecast)" strokeWidth="1.5" markerEnd="url(#arrow-violet)" />

          {/* Decision Gate to Calibration (ACCEPT path) */}
          <path d="M 672 452 L 716 452" fill="none" stroke="var(--color-risk)" strokeWidth="1.5" markerEnd="url(#arrow-amber)" />
          <text x="694" y="445" fill="var(--color-risk)" fontSize="8" fontFamily="monospace" fontWeight="700" textAnchor="middle">
            ACCEPT
          </text>

          {/* Calibration to Output Stage */}
          <path d="M 900 452 L 928 452 L 928 131 L 954 131" fill="none" stroke="var(--color-risk)" strokeWidth="1.5" markerEnd="url(#arrow-amber)" />

          {/* Output Stage to Deliverable branches */}
          <path d="M 1060 190 L 1060 230" fill="none" stroke="var(--color-risk)" strokeWidth="1.5" markerEnd="url(#arrow-amber)" />
          <path d="M 1060 326 L 1060 344" fill="none" stroke="var(--color-forecast)" strokeWidth="1.5" markerEnd="url(#arrow-violet)" />
          <path d="M 1060 440 L 1060 458" fill="none" stroke="var(--color-risk)" strokeWidth="1.5" markerEnd="url(#arrow-amber)" />

          {/* Continuous Animated Circuit Beam Packet (Decision D32) */}
          <circle ref={beamRef} cx="244" cy="126" r="4.5" fill="var(--color-observed)" filter="url(#circuit-glow)" />
        </svg>
      </div>

      {/* Focused Stage Inspection HUD */}
      <div 
        className="rounded-lg border-l-2 border-l-forecast border-y border-r border-line bg-raised/50 p-4 transition-all"
        aria-live="polite"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-line bg-rail text-fg-2 font-medium">
                {selectedDetail.code}
              </span>
              <span className="font-mono text-xs font-semibold text-forecast uppercase tracking-wider">
                {selectedDetail.eyebrow}
              </span>
              <span className="text-line-strong">·</span>
              <span className="font-mono text-xs text-fg-3">
                {selectedDetail.line1}
              </span>
            </div>
            <h2 className="text-base font-bold text-fg">
              {selectedItem.title}
            </h2>
            <p className="text-xs leading-relaxed text-fg-2">
              {selectedItem.explanation}
            </p>
          </div>

          <div className="shrink-0 pt-1">
            <Link
              href={selectedItem.href}
              className="inline-flex items-center gap-1.5 rounded border border-forecast/40 bg-forecast/10 px-3 py-1.5 text-xs font-medium text-fg hover:bg-forecast/20 hover:border-forecast transition-all"
            >
              <span>See it in Mission Control: {selectedItem.feature}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forecast">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

interface SvgNodeProps {
  id: string;
  title: string;
  item: PipelineItem;
  detail: NodeDetail;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

// SVG Blueprint Node Card
function SvgNode({ id, title, item, detail, x, y, w, h, color, selected, onSelect }: SvgNodeProps) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${title}. ${item.explanation}`}
      onClick={() => onSelect(id)}
      onMouseEnter={() => onSelect(id)}
      onFocus={() => onSelect(id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(id);
        }
      }}
      className="cursor-pointer focus:outline-none"
    >
      {/* Background card */}
      <rect
        width={w}
        height={h}
        rx="3"
        fill={selected ? "#101827" : "#070b12"}
        stroke={selected ? color : "var(--color-line)"}
        strokeWidth={selected ? "2" : "1"}
      />

      {/* Left accent bar */}
      <rect
        x="0"
        y="0"
        width="3"
        height={h}
        rx="1"
        fill={color}
        opacity={selected ? "1" : "0.5"}
      />

      {/* Eyebrow & Code */}
      <text x="12" y="20" fill={color} fontSize="9" fontFamily="monospace" fontWeight="700" letterSpacing="0.5">
        {detail.eyebrow}
      </text>
      <text x={w - 12} y="20" fill="var(--color-fg-3)" fontSize="9" fontFamily="monospace" textAnchor="end">
        {detail.code}
      </text>

      {/* Title */}
      <foreignObject x="12" y="26" width={w - 24} height={42}>
        <div className="text-xs font-semibold text-fg leading-tight line-clamp-2 select-none">
          {title}
        </div>
      </foreignObject>

      {/* Parameters / Specs */}
      <text x="12" y="84" fill="var(--color-fg-2)" fontSize="9.5" fontFamily="monospace">
        {detail.line1}
      </text>
      <text x="12" y="98" fill="var(--color-fg-3)" fontSize="9" fontFamily="monospace">
        {detail.line2}
      </text>
    </g>
  );
}

export function PipelineSheet({ activeStageId }: PipelineSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">Pipeline</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto border-line bg-rail px-4 pb-6 pt-4 sm:px-6">
        <SheetHeader className="mx-auto w-full max-w-6xl text-left">
          <SheetTitle className="text-base font-semibold">Forecast pipeline</SheetTitle>
          <SheetDescription className="text-xs text-fg-3">Current operational context is highlighted in the technical flow.</SheetDescription>
        </SheetHeader>
        <div className="mx-auto mt-4 w-full max-w-6xl">
          <PipelineDiagram key={activeStageId ?? "default"} variant="compact" activeStageId={activeStageId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
