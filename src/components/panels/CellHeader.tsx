import { Chip } from "@/components/ui/Chip";
import type { Cell } from "@/types/scenario";

interface CellHeaderProps {
  cell: Cell;
}

// identifies the selected storm and its forecast state before panel details
export function CellHeader({ cell }: CellHeaderProps) {
  const isFirstFlash = cell.mode === "first-flash";

  return (
    <div className="border-b border-line bg-raised/20 p-4">
      {/* Target designation row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk opacity-60" />
            <span className="relative inline-flex rounded-full size-2 bg-risk" />
          </span>
          <span className="font-mono text-[9px] text-fg-3 uppercase tracking-widest">TARGET //</span>
          <span className="font-mono text-sm font-bold text-fg num tracking-wide">CELL {cell.id}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="num text-fg font-semibold">{cell.reflectivityDbz}</span>
          <span className="text-fg-3">dBZ</span>
          <span className="text-line-strong mx-0.5">·</span>
          <span className="num text-fg font-semibold">{cell.echoTopKm.toFixed(1)}</span>
          <span className="text-fg-3">km</span>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip variant={cell.mode === "active" ? "risk" : "forecast"}>
          {cell.stage}
        </Chip>
        {isFirstFlash ? (
          <Chip variant="neutral">Pre-initiation</Chip>
        ) : (
          <Chip variant="observed">Active convective core</Chip>
        )}
      </div>
    </div>
  );
}
