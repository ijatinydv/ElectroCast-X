"use client";

import { useEffect, useRef, useState } from "react";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import { Dial } from "@/components/ui/Dial";
import type { Scenario } from "@/types/scenario";
import { Clock, Navigation, ShieldAlert, Radio, Activity, CheckCircle2 } from "lucide-react";

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
    const forecast = styles.getPropertyValue("--color-forecast").trim() || "#988bd5";
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
      context.moveTo(12, centerY - 10 * scale);
      context.bezierCurveTo(width * 0.32, centerY - 28 * scale, width * 0.66, centerY - 62 * scale, width - 12, centerY - 72 * scale);
      context.lineTo(width - 12, centerY + 72 * scale);
      context.bezierCurveTo(width * 0.66, centerY + 62 * scale, width * 0.32, centerY + 28 * scale, 12, centerY + 10 * scale);
      context.closePath();
      context.fill();

      // Inner high-confidence corridor
      context.globalAlpha = 0.18;
      context.beginPath();
      context.moveTo(12, centerY - 6 * scale);
      context.bezierCurveTo(width * 0.32, centerY - 16 * scale, width * 0.66, centerY - 36 * scale, width - 12, centerY - 44 * scale);
      context.lineTo(width - 12, centerY + 44 * scale);
      context.bezierCurveTo(width * 0.66, centerY + 36 * scale, width * 0.32, centerY + 16 * scale, 12, centerY + 6 * scale);
      context.closePath();
      context.fill();

      // Center advection track line
      context.globalAlpha = 0.9;
      context.strokeStyle = forecast;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(12, centerY);
      context.bezierCurveTo(width * 0.32, centerY - 6, width * 0.66, centerY - 24, width - 12, centerY - 36);
      context.stroke();

      // Start origin pulse
      context.fillStyle = forecast;
      context.beginPath();
      context.arc(12, centerY, 3.5, 0, Math.PI * 2);
      context.fill();

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

// groups the three prepared forecast questions into Apple-grade explanatory bento showcases
export function QuestionSections() {
  const cell = scenario.frames.find((frame) => frame.t === 0)?.cells.find((item) => item.firstFlash);
  if (!cell?.firstFlash) throw new Error("Scenario A requires a first-flash forecast for the landing sections");

  const [selectedHorizon, setSelectedHorizon] = useState<15 | 30 | 60>(30);
  const probabilities = {
    15: cell.firstFlash.p15 * 100,
    30: cell.firstFlash.p30 * 100,
    60: cell.firstFlash.p60 * 100,
  };

  return (
    <section id="features" className="py-24 border-t border-line/60 bg-bg" aria-label="Forecast questions">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-rail/80 px-3 py-1 text-xs text-fg-2 backdrop-blur-md mb-4">
            <Activity size={13} className="text-observed" />
            <span>Forecaster Cognitive Model</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl text-fg">
            Three questions every emergency manager needs answered.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-fg-2 sm:text-lg">
            Conventional radar nowcasting looks at past echoes. ElectroCast-X computes the thermodynamic physics of electrification before the first cloud-to-ground flash occurs.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="flex flex-col gap-10">
          {/* Card 1: WHEN */}
          <article className="group rounded-3xl border border-line bg-gradient-to-b from-rail/80 to-rail/40 p-8 sm:p-12 backdrop-blur-xl transition-all hover:border-line-strong">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-risk mb-3">
                  <Clock size={14} />
                  <span>When · Electrification Timing</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
                  Know when a cloud is becoming electrified.
                </h3>
                <p className="mt-4 text-base leading-relaxed text-fg-2 max-w-xl">
                  The first-flash countdown combines rapid cloud-top cooling, mixed-phase radar growth, and the −10 °C isothermal level into one calibrated initiation window.
                </p>

                <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Horizon selection">
                  {([15, 30, 60] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelectedHorizon(h)}
                      aria-pressed={selectedHorizon === h}
                      className={`h-8 px-4 rounded-full text-xs font-medium transition-all ${
                        selectedHorizon === h
                          ? "bg-risk text-bg font-semibold shadow-sm"
                          : "border border-line bg-raised/60 text-fg-2 hover:text-fg hover:border-line-strong"
                      }`}
                    >
                      {h}-minute horizon ({probabilities[h].toFixed(0)}%)
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="rounded-2xl border border-line bg-raised/50 p-6 flex flex-col items-center shadow-lg">
                  <Dial
                    probability={probabilities[selectedHorizon]}
                    horizon={selectedHorizon}
                    windowStart={cell.firstFlash.windowMin[0]}
                    windowEnd={cell.firstFlash.windowMin[1]}
                    rising={selectedHorizon === 30}
                  />
                  <div className="mt-4 text-[11px] font-mono text-fg-3">
                    Target: Window {cell.firstFlash.windowMin[0]}–{cell.firstFlash.windowMin[1]} min
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Card 2: WHERE */}
          <article className="group rounded-3xl border border-line bg-gradient-to-b from-rail/80 to-rail/40 p-8 sm:p-12 backdrop-blur-xl transition-all hover:border-line-strong">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7 lg:order-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-forecast mb-3">
                  <Navigation size={14} />
                  <span>Where · Conformal Uncertainty</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
                  Follow the storm’s likely path, not a single point.
                </h3>
                <p className="mt-4 text-base leading-relaxed text-fg-2 max-w-xl">
                  The risk corridor follows neural advection vectors and expected cell growth or decay, widening mathematically where future trajectory is less certain.
                </p>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-line bg-raised/40 p-3">
                    <div className="text-[11px] text-fg-3">Velocity</div>
                    <div className="text-sm font-medium text-fg num mt-0.5">52 km/h</div>
                  </div>
                  <div className="rounded-xl border border-line bg-raised/40 p-3">
                    <div className="text-[11px] text-fg-3">Bearing</div>
                    <div className="text-sm font-medium text-fg num mt-0.5">74° ENE</div>
                  </div>
                  <div className="rounded-xl border border-line bg-raised/40 p-3">
                    <div className="text-[11px] text-fg-3">30m Width</div>
                    <div className="text-sm font-medium text-fg num mt-0.5">14.2 km</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 lg:order-1">
                <div className="rounded-2xl border border-line bg-raised/50 p-5 shadow-lg flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs text-fg-3 border-b border-line pb-2 mb-2">
                    <span>Advection corridor</span>
                    <span className="text-forecast font-mono">15 / 30 / 60 min</span>
                  </div>
                  <CorridorMiniView />
                </div>
              </div>
            </div>
          </article>

          {/* Card 3: HOW SURE */}
          <article className="group rounded-3xl border border-line bg-gradient-to-b from-rail/80 to-rail/40 p-8 sm:p-12 backdrop-blur-xl transition-all hover:border-line-strong">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-observed mb-3">
                  <Radio size={14} />
                  <span>How Sure · Counterfactual Truth</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
                  See which observations support the forecast.
                </h3>
                <p className="mt-4 text-base leading-relaxed text-fg-2 max-w-xl">
                  A visible sensor mask keeps uncertainty transparent. When Doppler radar, satellite, lightning, or NWP forecast feeds drop, corridors widen honestly rather than fabricating precision.
                </p>

                <div className="mt-6 flex items-center gap-4 text-xs text-fg-2">
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-observed" /> Conformal calibration</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-observed" /> 16-mask monotonicity</span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-line bg-raised/50 p-5 shadow-lg">
                  <div className="text-xs font-mono uppercase tracking-wider text-fg-3 mb-4">
                    Multimodal Sensor Matrix
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Doppler radar", role: "Volume & Echo Tops", age: "2 min", status: "online" },
                      { name: "INSAT satellite", role: "Cloud-top Cooling", age: "7 min", status: "online" },
                      { name: "Lightning network", role: "Total Flash Rate", age: "11 min", status: "delayed" },
                      { name: "NWP forecast", role: "Thermodynamic CAPE", age: "3 h", status: "online" },
                    ].map((sensor) => (
                      <div key={sensor.name} className="rounded-xl border border-line bg-rail/60 p-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className={`size-2 rounded-full ${sensor.status === "online" ? "bg-observed" : "bg-risk"}`} />
                          <span className="text-[10px] font-mono text-fg-3 num">{sensor.age}</span>
                        </div>
                        <div className="mt-2 text-xs font-medium text-fg">{sensor.name}</div>
                        <div className="text-[11px] text-fg-3 leading-tight mt-0.5">{sensor.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
