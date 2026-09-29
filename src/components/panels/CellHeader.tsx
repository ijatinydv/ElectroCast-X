import { Chip } from "@/components/ui/Chip";
import type { Cell } from "@/types/scenario";

interface CellHeaderProps {
  cell: Cell;
}

// identifies the selected storm and its forecast state before panel details
export function CellHeader({ cell }: CellHeaderProps) {
  const isFirstFlash = cell.mode === "first-flash";

  return (
    <div className="flex flex-col gap-2.5 border-b border-line bg-rail/80 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-risk" />
          <span className="font-mono text-[10px] text-fg-3 uppercase tracking-wider">TARGET //</span>
          <span className="font-mono text-sm font-semibold text-fg num">CELL {cell.id}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-fg-3">
          <span className="num text-fg-2 font-medium">{cell.reflectivityDbz}</span>
          <span>dBZ</span>
          <span className="text-line-strong">|</span>
          <span className="num text-fg-2 font-medium">{cell.echoTopKm.toFixed(1)}</span>
          <span>km TOP</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip variant={cell.mode === "active" ? "risk" : "forecast"}>
          {cell.stage}
        </Chip>
        {isFirstFlash ? (
          <Chip variant="neutral">Pre-initiation (flash data masked)</Chip>
        ) : (
          <Chip variant="observed">Active convective core</Chip>
        )}
      </div>
    </div>
  );
}
