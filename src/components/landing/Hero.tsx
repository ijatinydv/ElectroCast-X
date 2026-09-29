"use client";

import Link from "next/link";
import { m } from "motion/react";
import { ArrowRight, ChevronRight } from "lucide-react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import { Dial } from "@/components/ui/Dial";
import type { Scenario } from "@/types/scenario";

// anchors the initial sequence to prepared scenario values rather than presentation-only forecast numbers
const scenario = scenarioA as unknown as Scenario;

// provides the dial values used to introduce the first-flash forecast at the start of the hero
function heroDialValues(): { probability: number; windowStart: number; windowEnd: number; cellId: string } {
  const cell = scenario.frames.find((frame) => frame.t === 0)?.cells.find((item) => item.firstFlash);
  if (!cell?.firstFlash) throw new Error("Scenario A requires a first-flash forecast for the landing hero");
  return {
    probability: cell.firstFlash.p30 * 100,
    windowStart: cell.firstFlash.windowMin[0],
    windowEnd: cell.firstFlash.windowMin[1],
    cellId: cell.id,
  };
}

export function Hero() {
  const dial = heroDialValues();

  return (
    <section
      className="relative isolate min-h-screen flex items-center justify-between overflow-hidden px-6 pt-24 pb-16 sm:px-8 lg:px-12"
      aria-labelledby="landing-title"
    >
      {/* Background video loop */}
      <div className="absolute inset-0 -z-20 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="size-full object-cover opacity-80"
        >
          <source src="/media/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Soft atmospheric gradient: protects text legibility on the left, leaves the rest of the video clear and luminous */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/40 via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-70" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-16 z-10">
        {/* Left Headline & Value Proposition */}
        <div className="max-w-2xl">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="inline-flex items-center gap-2 rounded border border-line bg-rail px-3 py-1 text-xs text-fg-2 mb-6"
          >
            <span className="size-1.5 rounded-full bg-observed" />
            <span className="font-mono text-[11px] text-fg-3 uppercase tracking-wider">SIH PS26072</span>
            <span className="text-line">|</span>
            <span>Physics-guided multimodal lightning nowcasting</span>
          </m.div>

          <h1
            id="landing-title"
            aria-label="Lightning warnings that start before the first flash."
            className="text-5xl font-semibold tracking-[-0.04em] text-fg sm:text-6xl lg:text-7xl leading-[1.02]"
          >
            <m.span
              aria-hidden="true"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
              className="block"
            >
              Lightning warnings
            </m.span>
            <m.span
              aria-hidden="true"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
              className="block text-fg-2"
            >
              that start before
            </m.span>
            <m.span
              aria-hidden="true"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
              className="block"
            >
              the first flash.
            </m.span>
          </h1>

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-fg-2 sm:text-lg"
          >
            ElectroCast-X forecasts when a developing cloud will first produce lightning, where an active storm will go, and how far to trust it—15, 30 and 60 minutes ahead.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/mission-control"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-fg px-5 text-sm font-medium text-bg hover:bg-fg/90 transition-colors group"
            >
              <span>Open Mission Control</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/how-it-works"
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-rail px-4 text-sm font-medium text-fg-2 hover:text-fg hover:border-line-strong transition-colors"
            >
              <span>Explore Architecture</span>
              <ChevronRight size={15} className="text-fg-3" />
            </Link>
          </m.div>

          {/* Quick Metrics Bar */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-10 flex flex-wrap items-center gap-6 border-t border-line pt-6 text-xs text-fg-3"
          >
            <div>
              <span className="num text-fg font-medium text-sm">+18 min</span>
              <span className="block mt-0.5 text-fg-3">First-flash lead time</span>
            </div>
            <div className="h-6 w-px bg-line" />
            <div>
              <span className="num text-fg font-medium text-sm">1 km / 5 min</span>
              <span className="block mt-0.5 text-fg-3">Physics-guided update</span>
            </div>
            <div className="h-6 w-px bg-line" />
            <div>
              <span className="text-fg font-medium text-sm">Odisha DWR</span>
              <span className="block mt-0.5 text-fg-3">Dual-pol radar network</span>
            </div>
          </m.div>
        </div>

        {/* Right Signature Element: Operational Telemetry & Dial Monitor */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          className="w-full max-w-sm shrink-0 self-center lg:self-auto"
        >
          <div className="relative rounded-lg border border-line bg-rail/95 p-5 shadow-2xl">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-line pb-3.5 mb-4">
              <div>
                <div className="text-[10px] font-mono tracking-wider text-fg-3 uppercase">Convective Target</div>
                <div className="text-sm font-medium text-fg flex items-center gap-2 mt-0.5">
                  <span className="num font-mono">Cell {dial.cellId}</span>
                  <span className="inline-flex items-center gap-1.5 rounded bg-risk/10 border border-risk/30 px-1.5 py-0.5 text-[11px] font-mono text-risk">
                    <span className="size-1.5 rounded-full bg-risk" />
                    Initiating
                  </span>
                </div>
              </div>
              <span className="rounded bg-raised px-2 py-1 text-[11px] font-mono text-fg-2 border border-line">
                Window {dial.windowStart}–{dial.windowEnd}m
              </span>
            </div>

            {/* Dial centerpiece */}
            <div className="flex justify-center py-2">
              <Dial
                probability={dial.probability}
                windowStart={dial.windowStart}
                windowEnd={dial.windowEnd}
                rising={true}
              />
            </div>

            {/* Physical initiation milestones */}
            <div className="mt-4 rounded border border-line bg-raised/40 p-3">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="text-fg-2 text-xs font-medium">Physical initiation sequence</span>
                <span className="font-mono text-risk text-[11px] num font-medium">P(flash) = 78%</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-fg-3 border-b border-line/40 pb-1.5">
                  <span>−30m: Reflectivity surge</span>
                  <span className="num text-fg-2">35 dBZ at −10°C</span>
                </div>
                <div className="flex items-center justify-between text-fg-3 border-b border-line/40 pb-1.5">
                  <span>−15m: ZDR column breach</span>
                  <span className="num text-observed">+2.1 dB above 0°C</span>
                </div>
                <div className="flex items-center justify-between text-fg">
                  <span className="text-risk font-medium">t₀ (NOW): Forecast window</span>
                  <span className="num text-risk font-medium">+18–32 min</span>
                </div>
              </div>
            </div>

            {/* Physical Signatures */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-line bg-raised/30 p-2.5">
                <div className="text-[10px] text-fg-3">Cloud-top cooling</div>
                <div className="num text-fg font-medium mt-0.5">−4.2 °C/10 min</div>
              </div>
              <div className="rounded border border-line bg-raised/30 p-2.5">
                <div className="text-[10px] text-fg-3">ZDR Column</div>
                <div className="num text-fg font-medium mt-0.5">Reached −10 °C</div>
              </div>
            </div>
          </div>
        </m.div>
      </div>

      {/* Honest simulation watermark */}
      <p className="absolute bottom-4 left-6 text-xs text-fg-3 sm:left-8 lg:left-12">
        Simulated demo scenario over Odisha
      </p>
    </section>
  );
}
