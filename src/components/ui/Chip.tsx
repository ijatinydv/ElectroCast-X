import * as React from "react";
import { cn } from "@/lib/utils";

type ChipVariant = "observed" | "forecast" | "risk" | "alert" | "neutral";

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ChipVariant;
}

export function Chip({ variant = "neutral", className, children, ...props }: ChipProps) {
  const variantStyles = {
    observed: "bg-observed/16 text-observed ring-1 ring-observed/30",
    forecast: "bg-forecast/16 text-forecast ring-1 ring-forecast/30",
    risk: "bg-risk/16 text-risk ring-1 ring-risk/30",
    alert: "bg-alert/16 text-alert ring-1 ring-alert/30",
    neutral: "bg-raised text-fg-2 ring-1 ring-line",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium normal-case tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
