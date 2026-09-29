"use client";

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#070b12] text-[#86868b]">
      <div className="mx-auto max-w-6xl px-6 py-28 text-center flex flex-col items-center">
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-white">
          Ready to explore the forecast?
        </h3>
        <p className="mt-4 max-w-md text-base text-[#86868b]">
          Launch the mission control interface and run live storm scenarios.
        </p>
        <Link
          href="/mission-control"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black hover:bg-white/90 transition-all shadow-lg shadow-white/5 active:scale-[0.99]"
        >
          Open Mission Control
        </Link>

        <div className="mt-24 w-full border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">ElectroCast-X</span>
            <span>·</span>
            <span>Simulated demo scenario over Odisha</span>
          </div>

          <div className="flex items-center gap-6 text-[#86868b]">
            <Link href="/mission-control" className="hover:text-white transition-colors">Mission Control</Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="/validation" className="hover:text-white transition-colors">Validation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
