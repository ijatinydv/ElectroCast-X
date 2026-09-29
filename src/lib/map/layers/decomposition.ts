import { cellRadiusPx } from "../project";
import type { Layer } from "../engine";

// separates forecast movement, intensity tendency, and initiation without altering prepared scenario data
export const decompositionLayer: Layer = {
  id: "decomposition",
  draw: (context, state, time) => {
    if (state.decompositionOpacity === 0 || state.frame.t <= 0) return;

    for (const cell of state.frame.cells) {
      const center = state.projection.project(cell.centroid);
      const radius = Math.max(12, cellRadiusPx(cell, state.projection));
      const heading = (cell.motion.dirDeg * Math.PI) / 180;
      const direction = [Math.sin(heading), -Math.cos(heading)] as const;
      const corridor = cell.corridors["30"];
      const corridorReach = corridor.outer.reduce((reach, point) => {
        const [x, y] = state.projection.project(point);
        return Math.max(reach, Math.hypot(x - center[0], y - center[1]));
      }, radius * 1.4);

      context.save();
      context.globalAlpha = state.decompositionOpacity;

      context.strokeStyle = state.theme.forecast;
      context.lineWidth = 1 + cell.decomposition.motion * 2;
      context.globalAlpha *= 0.35 + cell.decomposition.motion * 0.65;
      for (const position of [0.2, 0.5, 0.8]) {
        const distance = corridorReach * (position * 2 - 1);
        const streakLength = Math.max(10, corridorReach * 0.28);
        const startX = center[0] + direction[0] * (distance - streakLength / 2);
        const startY = center[1] + direction[1] * (distance - streakLength / 2);
        const endX = center[0] + direction[0] * (distance + streakLength / 2);
        const endY = center[1] + direction[1] * (distance + streakLength / 2);
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
      }

      const growth = cell.decomposition.growth;
      context.globalAlpha = state.decompositionOpacity * (0.2 + Math.abs(growth) * 0.6);
      context.fillStyle = growth > 0 ? state.theme.risk : state.theme.observed;
      context.beginPath();
      context.arc(center[0], center[1], Math.max(5, radius * Math.abs(growth)), 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = state.theme.observed;
      context.fillStyle = state.theme.observed;
      context.lineWidth = 1;
      context.font = `11px ${state.theme.fontMono}`;
      context.textAlign = "left";
      context.textBaseline = "middle";
      for (const site of cell.decomposition.initiationSites) {
        const [x, y] = state.projection.project(site);
        const pulse = (Math.sin(time / 900) + 1) / 2;
        const ringRadius = Math.max(9, radius * 0.55) + pulse * Math.max(7, radius * 0.35);
        context.globalAlpha = state.decompositionOpacity * (0.8 - pulse * 0.35);
        context.beginPath();
        context.arc(x, y, ringRadius, 0, Math.PI * 2);
        context.stroke();
        context.globalAlpha = state.decompositionOpacity;
        context.fillText("New cell", x + ringRadius + 5, y);
      }
      context.restore();
    }
  },
};
