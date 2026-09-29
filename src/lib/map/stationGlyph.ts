import type { Cell } from "@/types/scenario";

// keeps dense storm frames readable while retaining detail for focused cells
export const FULL_GLYPH_CELL_THRESHOLD = 3;

// fixes the station face at a compact readable map scale
export const STATION_GLYPH_RADIUS_PX = 9;

// shares the selection and pointer target radius across map interactions
export const STATION_GLYPH_SELECTION_RADIUS_PX = 13;

// describes the wind-barb marks needed after speed rounding
export interface MotionTicks {
  full: number;
  half: boolean;
  pennant: boolean;
}

// provides the three station-model readouts independently from canvas rendering
export interface GlyphNumerals {
  upperLeft: string;
  lowerLeft: string;
  right: string;
}

// converts the prepared headline risk into a bounded sky-cover fill fraction
export function glyphFillFraction(cell: Pick<Cell, "headlineRisk">): number {
  return Math.min(1, Math.max(0, cell.headlineRisk / 100));
}

// translates a rounded motion speed into station-model wind-barb marks
export function motionTicks(speedKmh: number): MotionTicks {
  const roundedSpeed = Math.max(0, Math.round(speedKmh / 5) * 5);
  const pennant = roundedSpeed >= 60;
  const remainder = pennant ? roundedSpeed - 50 : roundedSpeed;

  return {
    full: Math.floor(remainder / 10),
    half: remainder % 10 >= 5,
    pennant,
  };
}

// formats prepared cell values for the station glyph's three mono readouts
export function glyphNumerals(cell: Pick<Cell, "echoTopKm" | "flashRate" | "headlineRisk" | "mode" | "id">): GlyphNumerals {
  return {
    upperLeft: `${cell.echoTopKm.toFixed(1)}km`,
    lowerLeft: cell.mode === "active" ? `${cell.flashRate.toFixed(1)}/min` : `${Math.round(cell.headlineRisk)}%`,
    right: cell.id,
  };
}
