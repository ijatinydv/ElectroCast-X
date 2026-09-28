import * as React from "react";
import { cn } from "@/lib/utils";

interface SparklineProps extends Omit<React.SVGAttributes<SVGSVGElement>, "values"> {
  values: number[];
  color?: string; // CSS color string or class
  markerIndex?: number;
}

export function Sparkline({ values, color = "var(--color-observed)", width = 100, height = 30, markerIndex, className, ...props }: SparklineProps) {
  if (values.length === 0) return null;
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid / 0
  
  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * Number(width);
    const y = Number(height) - ((val - min) / range) * Number(height);
    return `${x},${y}`;
  }).join(" ");

  let markerX = 0;
  let markerY = 0;
  if (markerIndex !== undefined && markerIndex >= 0 && markerIndex < values.length) {
    markerX = (markerIndex / (values.length - 1)) * Number(width);
    markerY = Number(height) - ((values[markerIndex]! - min) / range) * Number(height);
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      {...props}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {markerIndex !== undefined && (
        <circle cx={markerX} cy={markerY} r="3" fill={color} />
      )}
    </svg>
  );
}
