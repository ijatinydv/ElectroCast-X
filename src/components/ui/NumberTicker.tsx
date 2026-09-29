"use client";
import * as React from "react";
import { useMotionValue, useSpring, useTransform, m } from "motion/react";
import { cn } from "@/lib/utils";

// describes the source precision required while a numeric display animates
interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
  precision?: number;
}

// animates displayed forecast values without losing precision from the source data
export function NumberTicker({ value, direction = "up", className, precision = 0 }: NumberTickerProps) {
  const motionValue = useMotionValue(direction === "down" ? value + 100 : 0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  const display = useTransform(springValue, (current) => Number(current.toFixed(precision)));

  React.useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return (
    <m.span className={cn("inline-block num", className)}>
      {display}
    </m.span>
  );
}
