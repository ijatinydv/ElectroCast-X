"use client";

import Link from "next/link";
import { m } from "motion/react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import { HeroMapLoop } from "@/components/landing/HeroMapLoop";
import { Dial } from "@/components/ui/Dial";
import type { Scenario } from "@/types/scenario";

// anchors the initial sequence to prepared scenario values rather than presentation-only forecast numbers
const scenario = scenarioA as unknown as Scenario;

// provides the dial values used to introduce the first-flash forecast at the start of the hero
function heroDialValues(): { probability: number; windowStart: number; windowEnd: number } {
  const cell = scenario.frames.find((frame) => frame.t === 0)?.cells.find((item) => item.firstFlash);
  if (!cell?.firstFlash) throw new Error("Scenario A requires a first-flash forecast for the landing hero");
  return { probability: cell.firstFlash.p30 * 100, windowStart: cell.firstFlash.windowMin[0], windowEnd: cell.firstFlash.windowMin[1] };
}

// presents the product’s live map before its explanation and keeps all initial motion in one sequence
export function Hero() {
  const dial = heroDialValues();

  return (
    <section className="relative isolate flex min-h-svh items-end overflow-hidden border-b border-line px-5 pb-12 pt-28 sm:px-8 lg:px-12 lg:pb-16" aria-labelledby="landing-title">
      <m.div initial={{ opacity: 0, filter: "blur(8px)" }} animate={{ opacity: 0.6, filter: "blur(0px)" }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="absolute inset-0 -z-20">
        <HeroMapLoop />
      </m.div>
      <div className="max-w-2xl">
        <m.p initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.2, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="mb-5 text-sm text-observed">ElectroCast-X</m.p>
        <h1 id="landing-title" aria-label="Lightning warnings that start before the first flash." className="max-w-[14ch] text-5xl font-medium leading-[0.98] tracking-[-0.04em] text-fg sm:text-6xl lg:text-7xl">
          <m.span aria-hidden="true" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="block">Lightning</m.span>
          <m.span aria-hidden="true" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="block">warnings that</m.span>
          <m.span aria-hidden="true" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="block">start before</m.span>
          <m.span aria-hidden="true" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="block">the first flash.</m.span>
        </h1>
        <m.p initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.76, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="mt-6 max-w-xl text-base leading-7 text-fg-2 sm:text-lg">
          ElectroCast-X forecasts when a developing cloud will first produce lightning, where an active storm will go, and how far to trust it, 15, 30 and 60 minutes ahead.
        </m.p>
        <m.div initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.88, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="mt-8 flex items-center gap-5">
          <Link href="/mission-control" className="inline-flex h-10 items-center bg-observed px-5 text-sm font-medium text-bg hover:bg-observed/90">Open Mission Control</Link>
          <Link href="/how-it-works" className="text-sm text-fg-2 underline decoration-line-strong underline-offset-4 hover:text-fg">How it works</Link>
        </m.div>
      </div>
      <m.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.98, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }} className="absolute bottom-10 right-5 hidden border border-line bg-rail/90 p-3 sm:block sm:right-8 lg:right-12">
        <Dial probability={dial.probability} windowStart={dial.windowStart} windowEnd={dial.windowEnd} />
      </m.div>
      <p className="absolute bottom-4 left-5 text-xs text-fg-3 sm:left-8 lg:left-12">Simulated demo scenario over Odisha</p>
    </section>
  );
}
