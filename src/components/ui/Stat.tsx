import * as React from "react";
import { cn } from "@/lib/utils";

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  delta?: string | number;
  deltaTrend?: "up" | "down" | "neutral";
}

export function Stat({ label, value, delta, deltaTrend = "neutral", className, ...props }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      <span className="text-[12px] text-fg-2 normal-case">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-mono num text-fg">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              "text-xs font-mono num",
              deltaTrend === "neutral" ? "text-fg-3" : "text-fg-2"
            )}
          >
            {deltaTrend === "up" ? "+" : ""}{delta}
          </span>
        )}
      </div>
    </div>
  );
}
