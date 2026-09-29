"use client";
import * as React from "react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { NumberTicker } from "@/components/ui/NumberTicker";

interface DialProps {
  probability: number; // 0-100
  rising?: boolean;
  windowStart?: number; // 0-60
  windowEnd?: number; // 0-60
  horizon?: 15 | 30 | 60;
  className?: string;
}

// visualizes the selected first-flash horizon without duplicating forecast values
export function Dial({ probability, rising, windowStart, windowEnd, horizon = 30, className }: DialProps) {
  const size = 168;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Cap probability between 0 and 100
  const p = Math.max(0, Math.min(100, probability));
  const offset = circumference - (p / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth={strokeWidth}
        />
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
        
        {/* Outer reference ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 8}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />

        {/* 5-minute ticks around the perimeter */}
        {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(min => {
          const isMajor = min === 15 || min === 30 || min === 60;
          const angle = min * 6 - 90;
          const rad = (angle * Math.PI) / 180;
          const tickLen = isMajor ? strokeWidth : strokeWidth / 2;
          const x1 = size / 2 + (radius - tickLen) * Math.cos(rad);
          const y1 = size / 2 + (radius - tickLen) * Math.sin(rad);
          const x2 = size / 2 + (radius + tickLen) * Math.cos(rad);
          const y2 = size / 2 + (radius + tickLen) * Math.sin(rad);
          return (
            <line
              key={min}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isMajor ? "var(--color-line-strong)" : "var(--color-line)"}
              strokeWidth={isMajor ? 2 : 1}
            />
          );
        })}

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
      
      {rising && (
        <m.div
          className="absolute inset-0 rounded-full border-2 border-risk"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.85, 1, 0], scale: [0.9, 1, 1.05, 1.1] }}
          transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
        />
      )}

      <div className="flex flex-col items-center text-center z-10 w-24">
        <div className="text-3xl font-mono font-medium text-fg num">
          <NumberTicker value={p} />%
        </div>
        <div className="text-[11px] text-fg-2 mt-1 leading-tight normal-case">
          chance of first flash within {horizon} min
        </div>
      </div>
    </div>
  );
}
