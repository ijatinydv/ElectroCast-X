"use client";
import * as React from "react";
import { useMotionValue, useSpring, useTransform, m } from "motion/react";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
}

export function NumberTicker({ value, direction = "up", className }: NumberTickerProps) {
  const motionValue = useMotionValue(direction === "down" ? value + 100 : 0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  const display = useTransform(springValue, (current) => Math.round(current));

  React.useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return (
    <m.span className={cn("inline-block num", className)}>
      {display}
    </m.span>
  );
}
