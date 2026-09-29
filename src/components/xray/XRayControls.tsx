"use client";

import { Switch } from "@/components/ui/switch";

// defines the independently visible physical layers in the storm twin
export type XRayFeatureVisibility = {
  reflectivity: boolean;
  zdrColumn: boolean;
  kdpCore: boolean;
  updraft: boolean;
  mixedPhase: boolean;
  flashes: boolean;
};

// gives operators compact accessible control over each physical scene layer
export function XRayControls({ features, onFeatureChange }: { features: XRayFeatureVisibility; onFeatureChange: (feature: keyof XRayFeatureVisibility, visible: boolean) => void }) {
  const controls: { feature: keyof XRayFeatureVisibility; label: string }[] = [
    { feature: "reflectivity", label: "Reflectivity volume" },
    { feature: "zdrColumn", label: "ZDR column" },
    { feature: "kdpCore", label: "KDP core" },
    { feature: "updraft", label: "Updraft" },
    { feature: "mixedPhase", label: "Graupel and mixed-phase region" },
    { feature: "flashes", label: "Flashes" },
  ];

  return (
    <fieldset className="w-56 border border-line bg-bg/95 p-3">
      <legend className="px-1 text-xs font-medium text-fg">Physical features</legend>
      <div className="mt-2 space-y-2.5">
        {controls.map(({ feature, label }) => (
          <label className="flex items-center justify-between gap-3 text-xs text-fg-2" key={feature}>
            <span>{label}</span>
            <Switch aria-label={`Toggle ${label}`} checked={features[feature]} onCheckedChange={(visible) => onFeatureChange(feature, visible)} size="sm" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
