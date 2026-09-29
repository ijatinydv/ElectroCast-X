"use client";

import { Building2, GraduationCap, RadioTower } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { exposureFor, type ExposureAsset } from "@/lib/derive";
import { corridorFor } from "@/lib/derive/corridor";
import { getSyntheticAssets } from "@/lib/geo/load";
import { useStore } from "@/store/useStore";
import type { Cell } from "@/types/scenario";

// presents all corridor exposure types while keeping map emphasis tied to enabled layers
export function ExposurePanel({ cell }: { cell: Cell }) {
  const horizon = useStore((state) => state.horizon);
  const highlightAsset = useStore((state) => state.highlightAsset);
  const exposure = exposureFor(corridorFor(cell, horizon, 1), getSyntheticAssets(), cell);
  const groups = [
    { label: "Villages", count: exposure.villages, type: "village" as const, icon: Building2 },
    { label: "Schools", count: exposure.schools, type: "school" as const, icon: GraduationCap },
    { label: "Hospitals", count: exposure.hospitals, type: "hospital" as const, icon: Building2 },
    { label: "Transmission corridors", count: exposure.transmission, type: "transmission" as const, icon: RadioTower },
  ].filter(({ count }) => count > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-fg">Potentially affected region</div>
        <Chip variant="neutral">synthetic</Chip>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {groups.map(({ label, count, type, icon: Icon }) => (
          <div key={type} className="border border-line p-2">
            <Icon size={15} className="text-fg-2" aria-hidden="true" />
            <div className="mt-1 num text-lg font-medium text-fg">{count}</div>
            <div className="text-xs text-fg-2">{label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between border-y border-line py-3">
        <div className="text-sm text-fg-2">Estimated arrival</div>
        <div className="num text-lg font-medium text-fg">{exposure.arrivalMin} min</div>
      </div>
      {groups.map(({ label, type }) => <ExposureItems key={type} label={label} assets={exposure.assets.filter((asset) => asset.type === type)} onSelect={highlightAsset} />)}
    </div>
  );
}

// lists the leading prepared assets so operators can focus the canvas on a named location
function ExposureItems({ label, assets, onSelect }: { label: string; assets: ExposureAsset[]; onSelect: (assetId: string) => void }) {
  if (assets.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs text-fg-2">{label}</div>
      <ul className="flex flex-col gap-1">
        {assets.slice(0, 3).map((asset) => (
          <li key={asset.id}>
            <button type="button" onClick={() => onSelect(asset.id)} className="w-full text-left text-sm text-fg underline decoration-line underline-offset-4 hover:text-risk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-risk">
              {asset.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
