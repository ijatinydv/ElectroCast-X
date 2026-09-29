"use client";

import { useEffect, useRef } from "react";
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
    const styles = getComputedStyle(canvas);
    const forecast = styles.getPropertyValue("--color-forecast").trim();
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
      context.fillStyle = forecast;
      context.globalAlpha = 0.12;
      context.beginPath();
      context.moveTo(8, centerY - 8 * scale);
      context.bezierCurveTo(width * 0.32, centerY - 22 * scale, width * 0.66, centerY - 48 * scale, width - 8, centerY - 56 * scale);
      context.lineTo(width - 8, centerY + 56 * scale);
      context.bezierCurveTo(width * 0.66, centerY + 48 * scale, width * 0.32, centerY + 22 * scale, 8, centerY + 8 * scale);
      context.closePath();
      context.fill();
      context.globalAlpha = 0.85;
      context.strokeStyle = forecast;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(8, centerY);
      context.bezierCurveTo(width * 0.32, centerY - 4, width * 0.66, centerY - 18, width - 8, centerY - 28);
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

  return <canvas ref={canvasRef} className="h-36 w-full" aria-label="Live widening risk corridor" role="img" />;
}

// groups the three prepared forecast questions into live explanatory views below the hero
export function QuestionSections() {
  const cell = scenario.frames.find((frame) => frame.t === 0)?.cells.find((item) => item.firstFlash);
  if (!cell?.firstFlash) throw new Error("Scenario A requires a first-flash forecast for the landing sections");

  return (
    <section className="border-b border-line" aria-label="Forecast questions">
      <article className="grid min-h-[28rem] items-center gap-10 border-b border-line px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-24">
        <div><p className="text-sm text-fg-2">When</p><h2 className="mt-3 text-3xl font-medium tracking-[-0.03em]">Know when a cloud is becoming electrified.</h2><p className="mt-4 max-w-lg leading-7 text-fg-2">The first-flash countdown combines rapid cloud-top cooling, mixed-phase radar growth and the −10 °C level into one forecast window.</p></div>
        <div className="flex justify-center border border-line bg-rail p-6"><Dial probability={cell.firstFlash.p30 * 100} windowStart={cell.firstFlash.windowMin[0]} windowEnd={cell.firstFlash.windowMin[1]} /></div>
      </article>
      <article className="grid min-h-[28rem] items-center gap-10 border-b border-line px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-24">
        <div className="lg:order-2"><p className="text-sm text-fg-2">Where</p><h2 className="mt-3 text-3xl font-medium tracking-[-0.03em]">Follow the storm’s likely path, not a single point.</h2><p className="mt-4 max-w-lg leading-7 text-fg-2">The risk corridor follows observed motion and expected growth or decay, widening where the future path is less certain.</p></div>
        <div className="border border-line bg-rail p-6 lg:order-1"><CorridorMiniView /></div>
      </article>
      <article className="grid min-h-[28rem] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-24">
        <div><p className="text-sm text-fg-2">How sure</p><h2 className="mt-3 text-3xl font-medium tracking-[-0.03em]">See which observations support the forecast.</h2><p className="mt-4 max-w-lg leading-7 text-fg-2">A visible sensor mask keeps uncertainty explicit when Doppler radar, satellite, lightning or NWP forecast inputs are unavailable.</p></div>
        <div className="border border-line bg-rail p-6"><span className="text-sm text-fg-2">Sensor mask</span><div className="mt-8 grid grid-cols-4 gap-3">{["Doppler radar", "INSAT satellite", "Lightning network", "NWP forecast"].map((sensor) => <div key={sensor} className="flex flex-col items-center gap-3 text-center text-xs text-fg-2"><span className="size-3 rounded-full bg-observed" /><span>{sensor}</span></div>)}</div></div>
      </article>
    </section>
  );
}
