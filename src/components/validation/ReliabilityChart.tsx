"use client";

import { useEffect, useRef } from "react";
import type { ECharts, EChartsCoreOption } from "echarts/core";

// describes the prepared calibration series supplied by the validation fixture
interface ReliabilityChartProps {
  forecastProbability: number[];
  observedFrequency: number[];
  label: string;
}

// converts application color tokens into a custom chart theme at render time
function chartTheme(element: HTMLElement) {
  const tokens = getComputedStyle(element);

  return {
    color: [tokens.getPropertyValue("--color-forecast").trim(), tokens.getPropertyValue("--color-observed").trim()],
    textStyle: { color: tokens.getPropertyValue("--color-fg-2").trim(), fontFamily: "var(--font-instrument-sans)" },
    axisPointer: { lineStyle: { color: tokens.getPropertyValue("--color-line-strong").trim() } },
  };
}

// renders the prepared reliability curve without placing ECharts in the initial route payload
export function ReliabilityChart({ forecastProbability, observedFrequency, label }: ReliabilityChartProps) {
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
      const forecast = tokens.getPropertyValue("--color-forecast").trim();
      const observed = tokens.getPropertyValue("--color-observed").trim();
      const muted = tokens.getPropertyValue("--color-fg-3").trim();
      const line = tokens.getPropertyValue("--color-line").trim();
      const option: EChartsCoreOption = {
        animation: false,
        grid: { top: 36, right: 22, bottom: 34, left: 44 },
        tooltip: { trigger: "axis", valueFormatter: (value: unknown) => `${Number(value) * 100}%` },
        legend: { top: 0, itemWidth: 10, itemHeight: 2, textStyle: { color: muted, fontSize: 11 } },
        xAxis: { type: "value", min: 0, max: 1, interval: 0.2, name: "Forecast probability", nameLocation: "middle", nameGap: 25, axisLabel: { color: muted, formatter: (value: unknown) => `${Number(value) * 100}%` }, axisLine: { lineStyle: { color: line } }, splitLine: { lineStyle: { color: line } } },
        yAxis: { type: "value", min: 0, max: 1, interval: 0.2, name: "Observed frequency", nameLocation: "middle", nameGap: 32, axisLabel: { color: muted, formatter: (value: unknown) => `${Number(value) * 100}%` }, axisLine: { lineStyle: { color: line } }, splitLine: { lineStyle: { color: line } } },
        series: [
          { name: "Perfect reliability", type: "line", data: [[0, 0], [1, 1]], symbol: "none", lineStyle: { color: muted, type: "dashed", width: 1 } },
          { name: "Illustrative forecast", type: "line", data: forecastProbability.map((value, index) => [value, observedFrequency[index]]), symbol: "circle", symbolSize: 7, lineStyle: { color: forecast, width: 2 }, itemStyle: { color: observed, borderColor: forecast, borderWidth: 1 } },
        ],
      };
      chart.setOption(option);
    });

    return () => {
      disposed = true;
      observer.disconnect();
      chart?.dispose();
    };
  }, [forecastProbability, observedFrequency]);

  return (
    <section className="border border-line bg-panel p-4" aria-labelledby="reliability-chart-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="reliability-chart-title" className="text-sm font-medium text-fg">Reliability diagram</h2>
          <p className="mt-1 text-xs leading-5 text-fg-2">Forecast probability compared with observed frequency.</p>
        </div>
        <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-fg-2 ring-1 ring-line">{label}</span>
      </div>
      <div ref={containerRef} className="h-72 w-full" role="img" aria-label="Illustrative placeholder reliability diagram showing forecast probabilities close to the perfect reliability diagonal" />
    </section>
  );
}
