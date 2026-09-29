"use client";

import { AnimatePresence, m } from "motion/react";
import { Button } from "@/components/ui/button";
import { guideSteps } from "@/lib/guide";
import { useStore } from "@/store/useStore";

interface GuideCaptionProps {
  onStop: () => void;
}

// keeps the active guide instruction visible over the map without duplicating guide state
export function GuideCaption({ onStop }: GuideCaptionProps) {
  const guided = useStore((state) => state.guided);
  const step = guideSteps[guided.step];

  return (
    <AnimatePresence>
      {guided.on && step && (
        <m.aside
          animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
          className="absolute bottom-5 left-1/2 z-40 flex w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 items-center gap-4 border border-line-strong bg-rail px-4 py-3"
          exit={{ opacity: 0, y: 8 }}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <p className="min-w-0 flex-1 text-sm leading-5 text-fg">{step.caption}</p>
          <span className="num shrink-0 text-xs text-fg-2">{guided.step + 1}/{guideSteps.length}</span>
          <Button className="shrink-0" onClick={onStop} size="sm" variant="outline">Stop</Button>
        </m.aside>
      )}
    </AnimatePresence>
  );
}
