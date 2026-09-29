"use client";
import * as React from "react";
import { animate } from "motion/react";
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
  const initialValue = direction === "down" ? value + 100 : 0;
  const [display, setDisplay] = React.useState(initialValue);
  const currentValue = React.useRef(initialValue);

  React.useEffect(() => {
    const controls = animate(currentValue.current, value, {
      duration: 0.4,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (current) => {
        currentValue.current = current;
        setDisplay(Number(current.toFixed(precision)));
      },
    });

    return controls.stop;
  }, [precision, value]);

  return <span className={cn("inline-block num", className)}>{display}</span>;
}
