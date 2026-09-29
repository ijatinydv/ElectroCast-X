"use client";

import Link from "next/link";
import { m } from "motion/react";
import { ArrowRight, ChevronRight } from "lucide-react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import { HeroMapLoop } from "@/components/landing/HeroMapLoop";
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
      className="relative isolate min-h-screen flex items-center justify-between overflow-hidden px-6 pt-28 pb-16 sm:px-8 lg:px-12"
      aria-labelledby="landing-title"
    >
      {/* Background live canvas loop showing Odisha radar across the full hero */}
      <m.div
        initial={{ opacity: 0, filter: "blur(12px)" }}
        animate={{ opacity: 0.65, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute inset-0 -z-20 pointer-events-none"
      >
        <HeroMapLoop />
        {/* Apple-grade atmospheric gradients: left is darkened for high text contrast, right allows radar storm visual to shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 via-50% to-bg/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/40" />
      </m.div>

      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-16 z-10">
        {/* Left Headline & Value Proposition */}
        <div className="max-w-2xl">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-rail/80 px-3.5 py-1 text-xs text-fg-2 backdrop-blur-md mb-6"
          >
            <span className="size-1.5 rounded-full bg-observed animate-pulse" />
            <span>Physics-Guided Multimodal Lightning Intelligence</span>
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
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/mission-control"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-bg hover:bg-fg/90 transition-all duration-200 shadow-lg shadow-white/5 group"
            >
              <span>Open Mission Control</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/how-it-works"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-rail/60 px-5 text-sm font-medium text-fg-2 hover:text-fg hover:border-line-strong transition-all duration-200 backdrop-blur-md"
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
            className="mt-10 flex flex-wrap items-center gap-6 border-t border-line/60 pt-6 text-xs text-fg-3"
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

        {/* Right Signature Element: Apple-Style Telemetry & Forecast Graph Card */}
        <m.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          className="w-full max-w-sm shrink-0 self-center lg:self-auto"
        >
          <div className="relative rounded-3xl border border-line-strong/60 bg-rail/85 p-6 backdrop-blur-2xl shadow-2xl ring-1 ring-white/5">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-fg-3">Live Telemetry</div>
                <div className="text-sm font-medium text-fg flex items-center gap-2 mt-0.5">
                  <span className="num">{dial.cellId}</span>
                  <span className="size-1.5 rounded-full bg-risk animate-pulse" />
                  <span className="text-xs text-risk font-normal">Initiating</span>
                </div>
              </div>
              <span className="rounded-full bg-raised px-2.5 py-1 text-[11px] font-mono text-fg-2 ring-1 ring-line">
                Window {dial.windowStart}–{dial.windowEnd} min
              </span>
            </div>

            {/* Dial centerpiece */}
            <div className="flex justify-center py-1">
              <Dial
                probability={dial.probability}
                windowStart={dial.windowStart}
                windowEnd={dial.windowEnd}
                rising={true}
              />
            </div>

            {/* Probability Trajectory Graph */}
            <div className="mt-4 rounded-2xl border border-line bg-raised/40 p-3.5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-fg-3">Probability Trajectory</span>
                <span className="font-mono text-risk font-medium text-[11px]">+64% in 20 min</span>
              </div>
              <div className="h-10 w-full">
                <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-risk)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--color-risk)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,36 Q 50,34 90,28 T 150,14 T 200,4 L 200,40 L 0,40 Z"
                    fill="url(#probGrad)"
                  />
                  <path
                    d="M 0,36 Q 50,34 90,28 T 150,14 T 200,4"
                    fill="none"
                    stroke="var(--color-risk)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="200" cy="4" r="3" fill="var(--color-risk)" className="animate-pulse" />
                </svg>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-fg-3 mt-1 border-t border-line/40 pt-1.5">
                <span>−30m</span>
                <span>−15m (ZDR breach)</span>
                <span className="text-risk font-medium">t₀ (78%)</span>
              </div>
            </div>

            {/* Physical Signatures */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-line bg-raised/30 p-2.5">
                <div className="text-[10px] text-fg-3">Cloud-top cooling</div>
                <div className="num text-fg font-medium mt-0.5">−4.2 °C/10 min</div>
              </div>
              <div className="rounded-xl border border-line bg-raised/30 p-2.5">
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
