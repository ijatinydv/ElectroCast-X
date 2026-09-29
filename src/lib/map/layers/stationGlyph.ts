import type { Layer } from "../engine";
import {
  FULL_GLYPH_CELL_THRESHOLD,
  glyphFillFraction,
  glyphNumerals,
  motionTicks,
  STATION_GLYPH_RADIUS_PX,
  STATION_GLYPH_SELECTION_RADIUS_PX,
} from "../stationGlyph";

// draws compact WMO-inspired cell summaries without allocating sprites or DOM overlays
export const stationGlyphLayer: Layer = {
  id: "stationGlyph",
  draw: (context, state) => {
    const glyphStroke = state.frame.kind === "obs" ? state.theme.observed : state.theme.forecast;

    for (const cell of state.frame.cells) {
      const [x, y] = state.projection.project(cell.centroid);
      const fillFraction = glyphFillFraction(cell);
      const isSelected = cell.id === state.selectedCellId;
      const isFullGlyph = isSelected || cell.id === state.hoveredCellId || state.frame.cells.length <= FULL_GLYPH_CELL_THRESHOLD;

      context.save();
      context.lineWidth = 1.5;

      if (fillFraction > 0 && fillFraction < 1) {
        context.beginPath();
        context.arc(x, y, STATION_GLYPH_RADIUS_PX, 0, Math.PI * 2);
        context.fillStyle = state.theme.background;
        context.fill();
      }
      if (fillFraction > 0) {
        context.beginPath();
        context.moveTo(x, y);
        context.arc(x, y, STATION_GLYPH_RADIUS_PX, -Math.PI / 2, -Math.PI / 2 + fillFraction * Math.PI * 2);
        context.closePath();
        context.fillStyle = state.theme.risk;
        context.fill();
      }

      context.beginPath();
      context.arc(x, y, STATION_GLYPH_RADIUS_PX, 0, Math.PI * 2);
      context.strokeStyle = glyphStroke;
      context.stroke();

      if (isFullGlyph) {
        const directionRadians = cell.motion.dirDeg * Math.PI / 180;
        const shaftX = Math.sin(directionRadians);
        const shaftY = -Math.cos(directionRadians);
        const clockwiseNormalX = -shaftY;
        const clockwiseNormalY = shaftX;
        const shaftStartX = x + shaftX * STATION_GLYPH_RADIUS_PX;
        const shaftStartY = y + shaftY * STATION_GLYPH_RADIUS_PX;
        const shaftEndX = shaftStartX + shaftX * 22;
        const shaftEndY = shaftStartY + shaftY * 22;
        const ticks = motionTicks(cell.motion.speedKmh);

        context.strokeStyle = glyphStroke;
        context.fillStyle = glyphStroke;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(shaftStartX, shaftStartY);
        context.lineTo(shaftEndX, shaftEndY);
        context.stroke();

        for (let index = 0; index < ticks.full + (ticks.half ? 1 : 0); index += 1) {
          const distance = 5 + index * 5;
          const tickLength = index < ticks.full ? 8 : 4;
          const tickStartX = shaftStartX + shaftX * distance;
          const tickStartY = shaftStartY + shaftY * distance;
          const tickEndX = tickStartX - shaftX * tickLength * 0.5 + clockwiseNormalX * tickLength * Math.sqrt(3) / 2;
          const tickEndY = tickStartY - shaftY * tickLength * 0.5 + clockwiseNormalY * tickLength * Math.sqrt(3) / 2;

          context.beginPath();
          context.moveTo(tickStartX, tickStartY);
          context.lineTo(tickEndX, tickEndY);
          context.stroke();
        }

        if (ticks.pennant) {
          const baseCenterX = shaftEndX - shaftX * 10;
          const baseCenterY = shaftEndY - shaftY * 10;
          context.beginPath();
          context.moveTo(shaftEndX, shaftEndY);
          context.lineTo(baseCenterX + clockwiseNormalX * 5, baseCenterY + clockwiseNormalY * 5);
          context.lineTo(baseCenterX - clockwiseNormalX * 5, baseCenterY - clockwiseNormalY * 5);
          context.closePath();
          context.fill();
        }

        const numerals = glyphNumerals(cell);
        context.font = `10px ${state.theme.fontMono}`;
        context.fillStyle = glyphStroke;
        context.textBaseline = "middle";
        context.textAlign = "right";
        context.fillText(numerals.upperLeft, x - 14, y - 10);
        context.fillText(numerals.lowerLeft, x - 14, y + 14);
        context.textAlign = "left";
        context.fillText(numerals.right, x + 14, y);
      }

      if (isSelected) {
        context.beginPath();
        context.arc(x, y, STATION_GLYPH_SELECTION_RADIUS_PX, 0, Math.PI * 2);
        context.strokeStyle = state.theme.foreground;
        context.lineWidth = 1;
        context.stroke();
      }

      context.restore();
    }
  },
};
