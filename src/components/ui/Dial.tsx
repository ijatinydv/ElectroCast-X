"use client";
import * as React from "react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";

interface DialProps {
  probability: number; // 0-100
  rising?: boolean;
  windowStart?: number; // 0-60
  windowEnd?: number; // 0-60
  className?: string;
}

export function Dial({ probability, rising, windowStart, windowEnd, className }: DialProps) {
  const size = 168;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Cap probability between 0 and 100
  const p = Math.max(0, Math.min(100, probability));
  const offset = circumference - (p / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Outer track */}
      <svg width={size} height={size} className="absolute inset-0 rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth={strokeWidth}
        />
        {/* Animated probability arc */}
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-risk)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          strokeLinecap="round"
        />
        
        {/* Ticks for 15, 30, 60. Angles: 15=90deg, 30=180deg, 60=360deg(0deg) */}
        {/* But circumference is 60 mins mapped to 360 degrees. */}
        {/* Let's draw ticks manually. 60m is a full circle. So 1m = 6 degrees. */}
        {[15, 30, 60].map(min => {
          const angle = min * 6 - 90; // -90 because we start at top
          const rad = (angle * Math.PI) / 180;
          const x1 = size / 2 + (radius - strokeWidth) * Math.cos(rad);
          const y1 = size / 2 + (radius - strokeWidth) * Math.sin(rad);
          const x2 = size / 2 + (radius + strokeWidth) * Math.cos(rad);
          const y2 = size / 2 + (radius + strokeWidth) * Math.sin(rad);
          return <line key={min} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-line-strong)" strokeWidth={2} />;
        })}

        {/* Window segment (optional) */}
        {windowStart !== undefined && windowEnd !== undefined && (
          <m.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-risk)"
            strokeWidth={strokeWidth + 4}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - ((windowEnd - windowStart) / 60) * circumference}
            style={{ rotate: `${(windowStart / 60) * 360}deg`, transformOrigin: 'center' }}
            strokeLinecap="round"
            opacity={0.3}
          />
        )}
      </svg>
      
      {/* Pulse effect if rising */}
      {rising && (
        <m.div
          className="absolute inset-0 rounded-full border-2 border-risk"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.85, 1, 0], scale: [0.9, 1, 1.05, 1.1] }}
          transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
        />
      )}

      {/* Centre content */}
      <div className="flex flex-col items-center text-center z-10 w-24">
        <div className="text-3xl font-mono font-medium text-fg num">
          <m.span>{p.toFixed(0)}</m.span>%
        </div>
        <div className="text-[11px] text-fg-2 mt-1 leading-tight normal-case">
          chance of first flash within 30 min
        </div>
      </div>
    </div>
  );
}
