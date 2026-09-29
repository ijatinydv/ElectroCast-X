"use client";

import Link from "next/link";
import { m } from "motion/react";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
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
      className="relative isolate min-h-screen flex items-center justify-between overflow-hidden px-5 pt-28 pb-16 sm:px-8 lg:px-12"
      aria-labelledby="landing-title"
    >
      {/* Background live canvas loop with subtle Apple vignette */}
      <m.div
        initial={{ opacity: 0, filter: "blur(12px)" }}
        animate={{ opacity: 0.55, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute inset-0 -z-20 pointer-events-none"
      >
        <HeroMapLoop />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-bg/50" />
      </m.div>

      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-16">
        {/* Left Headline & Pitch */}
        <div className="max-w-2xl">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-rail/80 px-3 py-1 text-xs text-fg-2 backdrop-blur-md mb-6"
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
        </div>

        {/* Right Signature Element Widget (Apple Pro Card Design) */}
        <m.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
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

            {/* Dial visual */}
            <div className="flex justify-center py-2">
              <Dial
                probability={dial.probability}
                windowStart={dial.windowStart}
                windowEnd={dial.windowEnd}
                rising={true}
              />
            </div>

            {/* Sub-card details */}
            <div className="mt-5 rounded-2xl border border-line bg-raised/50 p-3.5 text-xs">
              <div className="flex items-center justify-between text-fg-2">
                <span>Cloud-top cooling</span>
                <span className="num text-fg font-medium">−4.2 °C/10 min</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-fg-2">
                <span>ZDR column height</span>
                <span className="num text-fg font-medium">Reached −10 °C</span>
              </div>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}
