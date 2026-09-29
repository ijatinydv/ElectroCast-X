"use client";

import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-line/60 bg-rail/40 text-fg-2">
      {/* Pre-footer Call to Action */}
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-r from-rail via-raised to-rail p-8 sm:p-12 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-raised px-2.5 py-0.5 text-[11px] font-mono text-fg-2 ring-1 ring-line mb-3">
              <Shield size={12} className="text-observed" /> Ready for Operational Evaluation
            </span>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
              Experience the full Mission Control cockpit.
            </h3>
            <p className="mt-2 text-sm text-fg-2">
              Scrub storms in continuous time, simulate live radar failures, inspect 3D volumetric cloud twins, and compose multilingual CAP 1.2 alerts.
            </p>
          </div>
          <Link
            href="/mission-control"
            className="shrink-0 inline-flex h-11 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-bg hover:bg-fg/90 transition-all duration-200 shadow-md group"
          >
            <span>Launch Mission Control</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Footer Links & Metadata */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-line pt-8 text-xs text-fg-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-fg">ElectroCast-X</span>
            <span>·</span>
            <span>Physics-Guided Lightning Nowcasting</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-fg-2">
            <Link href="/mission-control" className="hover:text-fg transition-colors">
              Mission Control
            </Link>
            <Link href="/how-it-works" className="hover:text-fg transition-colors">
              Pipeline Architecture
            </Link>
            <Link href="/validation" className="hover:text-fg transition-colors">
              Validation
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-mono text-fg-3 ring-1 ring-line">
              Simulated demo scenario over Odisha
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
