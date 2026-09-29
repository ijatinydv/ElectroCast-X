"use client";

import { useEffect, useRef, useState } from "react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import { Dial } from "@/components/ui/Dial";
import type { Scenario } from "@/types/scenario";

// makes the prepared first-flash values available to the live explanatory mini-views
const scenario = scenarioA as unknown as Scenario;

// draws a small animated uncertainty corridor so the route explanation remains a live forecast view
function CorridorMiniView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const forecast = "#9e86ff";
    let animationFrame: number | null = null;
    let visible = true;

    // redraws the prepared corridor geometry at a subtle repeating uncertainty scale
    const draw = (now: number) => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const scale = 0.78 + ((Math.sin(now / 900) + 1) / 2) * 0.22;
      const centerY = height / 2;

      // Outer uncertainty boundary
      context.fillStyle = forecast;
      context.globalAlpha = 0.08;
      context.beginPath();
      context.moveTo(16, centerY - 10 * scale);
      context.bezierCurveTo(width * 0.32, centerY - 28 * scale, width * 0.66, centerY - 62 * scale, width - 16, centerY - 70 * scale);
      context.lineTo(width - 16, centerY + 70 * scale);
      context.bezierCurveTo(width * 0.66, centerY + 62 * scale, width * 0.32, centerY + 28 * scale, 16, centerY + 10 * scale);
      context.closePath();
      context.fill();

      // Inner high-confidence corridor
      context.globalAlpha = 0.16;
      context.beginPath();
      context.moveTo(16, centerY - 6 * scale);
      context.bezierCurveTo(width * 0.32, centerY - 16 * scale, width * 0.66, centerY - 36 * scale, width - 16, centerY - 42 * scale);
      context.lineTo(width - 16, centerY + 42 * scale);
      context.bezierCurveTo(width * 0.66, centerY + 36 * scale, width * 0.32, centerY + 16 * scale, 16, centerY + 6 * scale);
      context.closePath();
      context.fill();

      // Center trajectory line
      context.globalAlpha = 0.85;
      context.strokeStyle = forecast;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(16, centerY);
      context.bezierCurveTo(width * 0.32, centerY - 6, width * 0.66, centerY - 24, width - 16, centerY - 36);
      context.stroke();

      context.globalAlpha = 1;
      if (visible) animationFrame = window.requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible && animationFrame === null) animationFrame = window.requestAnimationFrame(draw);
      if (!visible && animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }, { threshold: 0.1 });

    observer.observe(canvas);
    animationFrame = window.requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} className="h-44 w-full" aria-label="Live widening risk corridor" role="img" />;
}

// presents the three core forecast principles in clean Apple-style editorial sections
export function QuestionSections() {
  const cell = scenario.frames.find((frame) => frame.t === 0)?.cells.find((item) => item.firstFlash);
  if (!cell?.firstFlash) throw new Error("Scenario A requires a first-flash forecast for the landing sections");

  const [horizon, setHorizon] = useState<15 | 30 | 60>(30);
  const probabilities = {
    15: cell.firstFlash.p15 * 100,
    30: cell.firstFlash.p30 * 100,
    60: cell.firstFlash.p60 * 100,
  };

  return (
    <section className="border-t border-white/10" aria-label="Forecast principles">
      {/* 01 / WHEN */}
      <article id="when" className="mx-auto max-w-6xl px-6 py-28 lg:py-36 grid items-center gap-16 lg:grid-cols-2 border-b border-white/5">
        <div className="max-w-xl">
          <p className="text-xs font-mono uppercase tracking-wider text-[#ffb020]">When</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-white leading-tight">
            Know when a cloud is becoming electrified.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#86868b] leading-relaxed">
            The first-flash countdown combines rapid cloud-top cooling, mixed-phase radar growth, and the −10 °C level into one forecast window.
          </p>

          <div className="mt-8 flex items-center gap-2" role="group" aria-label="Select horizon">
            {([15, 30, 60] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                aria-pressed={horizon === h}
                className={`h-8 px-4 rounded-full text-xs font-medium transition-all ${
                  horizon === h
                    ? "bg-[#ffb020] text-black font-semibold"
                    : "border border-white/10 bg-white/5 text-[#86868b] hover:text-white"
                }`}
              >
                {h} min ({probabilities[h].toFixed(0)}%)
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="rounded-3xl border border-white/10 bg-[#070b12] p-8 shadow-2xl flex flex-col items-center">
            <Dial
              probability={probabilities[horizon]}
              horizon={horizon}
              windowStart={cell.firstFlash.windowMin[0]}
              windowEnd={cell.firstFlash.windowMin[1]}
              rising={horizon === 30}
            />
            <div className="mt-4 text-xs font-mono text-[#86868b]">
              Initiation window: {cell.firstFlash.windowMin[0]}–{cell.firstFlash.windowMin[1]} min
            </div>
          </div>
        </div>
      </article>

      {/* 02 / WHERE */}
      <article id="where" className="mx-auto max-w-6xl px-6 py-28 lg:py-36 grid items-center gap-16 lg:grid-cols-2 border-b border-white/5">
        <div className="max-w-xl lg:order-2">
          <p className="text-xs font-mono uppercase tracking-wider text-[#9e86ff]">Where</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-white leading-tight">
            Follow the storm’s likely path, not a single point.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#86868b] leading-relaxed">
            The risk corridor follows observed storm motion and expected growth or decay, widening where the future path is less certain.
          </p>
        </div>

        <div className="lg:order-1">
          <div className="rounded-3xl border border-white/10 bg-[#070b12] p-6 shadow-2xl">
            <div className="text-xs font-mono text-[#86868b] mb-2 flex items-center justify-between">
              <span>Advection trajectory</span>
              <span className="text-[#9e86ff]">15 · 30 · 60 min</span>
            </div>
            <CorridorMiniView />
          </div>
        </div>
      </article>

      {/* 03 / HOW SURE */}
      <article id="how-sure" className="mx-auto max-w-6xl px-6 py-28 lg:py-36 grid items-center gap-16 lg:grid-cols-2">
        <div className="max-w-xl">
          <p className="text-xs font-mono uppercase tracking-wider text-[#4fd8eb]">How Sure</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-white leading-tight">
            See which observations support the forecast.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-[#86868b] leading-relaxed">
            A visible sensor mask keeps uncertainty explicit when Doppler radar, satellite, lightning or NWP forecast inputs are unavailable.
          </p>
        </div>

        <div>
          <div className="rounded-3xl border border-white/10 bg-[#070b12] p-8 shadow-2xl">
            <div className="text-xs font-mono text-[#86868b] mb-6">
              Multimodal input feeds
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Doppler radar", role: "Volume & Echo Tops" },
                { name: "INSAT satellite", role: "Cloud-top Cooling" },
                { name: "Lightning network", role: "Flash History" },
                { name: "NWP forecast", role: "Environmental CAPE" },
              ].map((feed) => (
                <div key={feed.name} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#4fd8eb]" />
                    <span className="text-sm font-medium text-white">{feed.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#86868b]">{feed.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
