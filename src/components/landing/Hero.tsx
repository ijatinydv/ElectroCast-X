"use client";

import Link from "next/link";
import { m } from "motion/react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import { HeroMapLoop } from "@/components/landing/HeroMapLoop";
import { Dial } from "@/components/ui/Dial";
import type { Scenario } from "@/types/scenario";

// anchors the initial sequence to prepared scenario values rather than presentation-only forecast numbers
const scenario = scenarioA as unknown as Scenario;

function heroDialValues(): { probability: number; windowStart: number; windowEnd: number } {
  const cell = scenario.frames.find((frame) => frame.t === 0)?.cells.find((item) => item.firstFlash);
  if (!cell?.firstFlash) throw new Error("Scenario A requires a first-flash forecast for the landing hero");
  return {
    probability: cell.firstFlash.p30 * 100,
    windowStart: cell.firstFlash.windowMin[0],
    windowEnd: cell.firstFlash.windowMin[1],
  };
}

export function Hero() {
  const dial = heroDialValues();

  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-36 pb-20 text-center overflow-hidden">
      {/* Centered Hero Copy */}
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <m.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl md:text-7xl lg:text-8xl leading-[1.04]"
        >
          Lightning warnings that start before the first flash.
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-6 max-w-2xl text-lg sm:text-xl text-[#86868b] leading-relaxed font-normal"
        >
          ElectroCast-X forecasts when a developing cloud will first produce lightning, where an active storm will go, and how far to trust it, 15, 30 and 60 minutes ahead.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-8 flex items-center justify-center gap-6"
        >
          <Link
            href="/mission-control"
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-medium text-black hover:bg-white/90 transition-all shadow-lg shadow-white/5 active:scale-[0.99]"
          >
            Open Mission Control
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex h-12 items-center text-sm font-medium text-[#86868b] hover:text-white transition-colors"
          >
            How it works →
          </Link>
        </m.div>
      </div>

      {/* Cinematic Centerpiece: Live Radar Workstation Viewport */}
      <m.div
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="relative mx-auto mt-16 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#070b12] shadow-2xl shadow-black/80 aspect-[16/10] sm:aspect-[16/9] max-h-[560px]"
      >
        {/* Live Canvas Storm Loop */}
        <div className="absolute inset-0">
          <HeroMapLoop />
        </div>

        {/* Top-left Telemetry Tag */}
        <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-[#070b12]/80 px-3 py-1 text-[11px] font-mono text-[#86868b] backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-[#4fd8eb] animate-pulse" />
          <span>Odisha Radar Room · Live Replay</span>
        </div>

        {/* Bottom-right Signature Element: The First-Flash Dial Floating Widget */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:block rounded-2xl border border-white/10 bg-[#070b12]/85 p-4 backdrop-blur-xl shadow-2xl">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#86868b] mb-1 text-center">
            First-flash countdown
          </div>
          <Dial
            probability={dial.probability}
            windowStart={dial.windowStart}
            windowEnd={dial.windowEnd}
            rising={true}
          />
        </div>
      </m.div>
    </section>
  );
}
