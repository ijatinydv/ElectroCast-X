"use client";

import * as React from "react";

// describes the atmospheric slice control shared by the X-ray sheet and its scene
interface AltitudeSliderProps {
  altitudeKm: number;
  echoTopKm: number;
  freezingLevelKm: number;
  onAltitudeChange: (altitudeKm: number) => void;
}

// gives operators a keyboard-accessible vertical control for inspecting storm layers
export function AltitudeSlider({ altitudeKm, echoTopKm, freezingLevelKm, onAltitudeChange }: AltitudeSliderProps) {
  const bands = [
    { label: "0 °C freezing level", altitudeKm: freezingLevelKm },
    { label: "−10 °C strong mixed-phase region", altitudeKm: freezingLevelKm + 10 / 6.5 },
    { label: "−20 °C ice-charge separation", altitudeKm: freezingLevelKm + 20 / 6.5 },
  ];

  return (
    <div className="relative flex h-full w-48 shrink-0 flex-col justify-center border-r border-line bg-bg/95 px-4 py-8">
      <p className="mb-5 text-xs font-medium text-fg">Altitude slice</p>
      <div className="relative mx-auto h-72 w-full">
        <input
          aria-label="Slice altitude"
          aria-valuetext={`${altitudeKm.toFixed(1)} km altitude`}
          className="absolute left-5 top-0 h-72 w-3 cursor-pointer appearance-none accent-forecast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          max={echoTopKm}
          min={0}
          onChange={(event) => onAltitudeChange(Number(event.currentTarget.value))}
          step={0.1}
          style={{ writingMode: "vertical-lr", direction: "rtl" }}
          type="range"
          value={altitudeKm}
        />
        {bands.map((band) => {
          const top = `${100 - Math.min(echoTopKm, Math.max(0, band.altitudeKm)) / echoTopKm * 100}%`;
          return (
            <div className="absolute left-10 right-0 flex items-center gap-2" key={band.label} style={{ top }}>
              <span aria-hidden className="h-px w-3 shrink-0 bg-fg-2" />
              <span className="text-xs leading-4 text-fg-2">{band.label}</span>
            </div>
          );
        })}
      </div>
      <p className="num mt-5 text-xs text-fg-2">{altitudeKm.toFixed(1)} km</p>
    </div>
  );
}
