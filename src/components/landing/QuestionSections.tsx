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
    <section className="border-t border-line" aria-label="Forecast principles">
      {/* 01 / WHEN */}
      <article id="when" className="mx-auto max-w-6xl px-6 py-24 lg:py-32 grid items-center gap-16 lg:grid-cols-2 border-b border-line">
        <div className="max-w-xl">
          <p className="text-xs font-mono uppercase tracking-wider text-risk">01 / When</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-fg leading-tight">
            Know when a cloud is becoming electrified.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-fg-2 leading-relaxed">
            The first-flash countdown combines rapid cloud-top cooling, mixed-phase radar growth, and the −10 °C level into one calibrated forecast window.
          </p>

          <div className="mt-8 flex items-center gap-2" role="group" aria-label="Select horizon">
            {([15, 30, 60] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                aria-pressed={horizon === h}
                className={`h-8 px-4 rounded-md text-xs font-medium transition-colors ${
                  horizon === h
                    ? "bg-risk text-bg font-semibold"
                    : "border border-line bg-raised/40 text-fg-2 hover:text-fg hover:border-line-strong"
                }`}
              >
                {h} min (<span className="num">{probabilities[h].toFixed(0)}%</span>)
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-md rounded-lg border border-line bg-rail/80 p-8 shadow-xl flex flex-col items-center">
            <Dial
              probability={probabilities[horizon]}
              horizon={horizon}
              windowStart={cell.firstFlash.windowMin[0]}
              windowEnd={cell.firstFlash.windowMin[1]}
              rising={horizon === 30}
            />
            <div className="mt-5 text-xs font-mono text-fg-3">
              Initiation window: <span className="num text-fg-2">{cell.firstFlash.windowMin[0]}–{cell.firstFlash.windowMin[1]} min</span>
            </div>
          </div>
        </div>
      </article>

      {/* 02 / WHERE */}
      <article id="where" className="mx-auto max-w-6xl px-6 py-24 lg:py-32 grid items-center gap-16 lg:grid-cols-2 border-b border-line">
        <div className="max-w-xl lg:order-2">
          <p className="text-xs font-mono uppercase tracking-wider text-forecast">02 / Where</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-fg leading-tight">
            Follow the storm’s likely path, not a single point.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-fg-2 leading-relaxed">
            The risk corridor follows observed storm motion and expected growth or decay, widening where the future path is less certain.
          </p>
        </div>

        <div className="lg:order-1">
          <div className="rounded-lg border border-line bg-rail/80 p-6 shadow-xl">
            <div className="text-xs font-mono text-fg-3 mb-3 flex items-center justify-between">
              <span>Advection trajectory</span>
              <span className="text-forecast">15 · 30 · 60 min</span>
            </div>
            <CorridorMiniView />
          </div>
        </div>
      </article>

      {/* 03 / HOW SURE */}
      <article id="how-sure" className="mx-auto max-w-6xl px-6 py-24 lg:py-32 grid items-center gap-16 lg:grid-cols-2">
        <div className="max-w-xl">
          <p className="text-xs font-mono uppercase tracking-wider text-observed">03 / How Sure</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-fg leading-tight">
            See which observations support the forecast.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-fg-2 leading-relaxed">
            A visible sensor mask keeps uncertainty explicit when Doppler radar, satellite, lightning or NWP forecast inputs are unavailable.
          </p>
        </div>

        <div>
          <div className="rounded-lg border border-line bg-rail/80 p-8 shadow-xl">
            <div className="text-xs font-mono text-fg-3 mb-5 uppercase tracking-wider">
              Multimodal input telemetry
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Doppler radar", role: "Volume & Echo Tops" },
                { name: "INSAT satellite", role: "Cloud-top Cooling" },
                { name: "Lightning network", role: "Flash History" },
                { name: "NWP forecast", role: "Environmental CAPE" },
              ].map((feed) => (
                <div key={feed.name} className="rounded border border-line bg-raised/30 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-observed" />
                    <span className="text-sm font-medium text-fg">{feed.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-fg-3">{feed.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
