"use client";

import { MotionConfig, LazyMotion, domAnimation } from "motion/react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
