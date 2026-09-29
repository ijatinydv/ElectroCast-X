import { Chip } from "@/components/ui/Chip";
import type { Cell } from "@/types/scenario";

interface CellHeaderProps {
  cell: Cell;
}

// identifies the selected storm and its forecast state before panel details
export function CellHeader({ cell }: CellHeaderProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-line p-4">
      <div className="text-sm font-mono num text-fg">Cell {cell.id}</div>
      <div className="flex flex-wrap gap-2">
        <Chip variant={cell.mode === "active" ? "risk" : "forecast"}>{cell.stage}</Chip>
        {cell.mode === "first-flash" && <Chip variant="neutral">Flash data masked for this storm</Chip>}
      </div>
    </div>
  );
}
