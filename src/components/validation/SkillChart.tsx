"use client";

import { useEffect, useRef } from "react";
import type { ECharts, EChartsCoreOption } from "echarts/core";

// describes the prepared lead-time metrics supplied by the validation fixture
interface SkillChartProps {
  leadMinutes: number[];
  pod: number[];
  far: number[];
  csi: number[];
  brier: number[];
  label: string;
}

// converts application color tokens into a custom chart theme at render time
function chartTheme(element: HTMLElement) {
  const tokens = getComputedStyle(element);

  return {
    color: [tokens.getPropertyValue("--color-observed").trim(), tokens.getPropertyValue("--color-forecast").trim(), tokens.getPropertyValue("--color-risk").trim(), tokens.getPropertyValue("--color-fg-2").trim()],
    textStyle: { color: tokens.getPropertyValue("--color-fg-2").trim(), fontFamily: "var(--font-instrument-sans)" },
    axisPointer: { lineStyle: { color: tokens.getPropertyValue("--color-line-strong").trim() } },
  };
}

// renders lead-time skill curves only after the validation route reaches the browser
export function SkillChart({ leadMinutes, pod, far, csi, brier, label }: SkillChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let chart: ECharts | undefined;
    let disposed = false;
    const observer = new ResizeObserver(() => chart?.resize());
    observer.observe(element);

    void Promise.all([
      import("echarts/core"),
      import("echarts/charts"),
      import("echarts/components"),
      import("echarts/renderers"),
    ]).then(([echarts, charts, components, renderers]) => {
      if (disposed) return;

      echarts.use([charts.LineChart, components.GridComponent, components.TooltipComponent, components.LegendComponent, renderers.CanvasRenderer]);
      echarts.registerTheme("electrocast-validation", chartTheme(element));
      chart = echarts.init(element, "electrocast-validation", { renderer: "canvas" });

      const tokens = getComputedStyle(element);
      const line = tokens.getPropertyValue("--color-line").trim();
      const muted = tokens.getPropertyValue("--color-fg-3").trim();
      const colors = ["--color-observed", "--color-forecast", "--color-risk", "--color-fg-2"].map((token) => tokens.getPropertyValue(token).trim());
      const option: EChartsCoreOption = {
        animation: false,
        grid: { top: 56, right: 22, bottom: 34, left: 40 },
        tooltip: { trigger: "axis", valueFormatter: (value: unknown) => Number(value).toFixed(2) },
        legend: { top: 0, textStyle: { color: muted, fontSize: 11 }, itemWidth: 10, itemHeight: 2 },
        xAxis: { type: "category", data: leadMinutes.map((value) => `${value} min`), axisLabel: { color: muted }, axisLine: { lineStyle: { color: line } }, axisTick: { show: false } },
        yAxis: { type: "value", min: 0, max: 1, interval: 0.2, axisLabel: { color: muted, formatter: (value: unknown) => Number(value).toFixed(1) }, axisLine: { lineStyle: { color: line } }, splitLine: { lineStyle: { color: line } } },
        series: [
          { name: "POD", type: "line", data: pod, symbol: "circle", symbolSize: 6, lineStyle: { color: colors[0], width: 2 }, itemStyle: { color: colors[0] } },
          { name: "FAR", type: "line", data: far, symbol: "circle", symbolSize: 6, lineStyle: { color: colors[1], width: 2 }, itemStyle: { color: colors[1] } },
          { name: "CSI", type: "line", data: csi, symbol: "circle", symbolSize: 6, lineStyle: { color: colors[2], width: 2 }, itemStyle: { color: colors[2] } },
          { name: "Brier", type: "line", data: brier, symbol: "circle", symbolSize: 6, lineStyle: { color: colors[3], width: 2 }, itemStyle: { color: colors[3] } },
        ],
      };
      chart.setOption(option);
    });

    return () => {
      disposed = true;
      observer.disconnect();
      chart?.dispose();
    };
  }, [brier, csi, far, leadMinutes, pod]);

  return (
    <section className="border border-line bg-panel p-4" aria-labelledby="skill-chart-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="skill-chart-title" className="text-sm font-medium text-fg">Skill by lead time</h2>
          <p className="mt-1 text-xs leading-5 text-fg-2">POD, FAR, CSI and Brier score for 15, 30 and 60 minute lead times.</p>
        </div>
        <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-fg-2 ring-1 ring-line">{label}</span>
      </div>
      <div ref={containerRef} className="h-72 w-full" role="img" aria-label="Illustrative placeholder skill curves that decline gently across increasing forecast lead times" />
    </section>
  );
}
