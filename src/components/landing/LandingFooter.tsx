"use client";

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-rail text-fg-2">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center flex flex-col items-center">
        <h3 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-fg">
          Ready to explore the forecast?
        </h3>
        <p className="mt-3 max-w-md text-sm text-fg-2">
          Launch the mission control interface and run prepared convective storm scenarios.
        </p>
        <Link
          href="/mission-control"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-fg px-6 text-sm font-medium text-bg hover:bg-fg/90 transition-colors"
        >
          Open Mission Control
        </Link>

        <div className="mt-16 w-full border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-fg-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-fg">ElectroCast-X</span>
            <span>·</span>
            <span>Simulated demo scenario over Odisha</span>
          </div>

          <div className="flex items-center gap-6 text-fg-2">
            <Link href="/mission-control" className="hover:text-fg transition-colors">Mission Control</Link>
            <Link href="/how-it-works" className="hover:text-fg transition-colors">Architecture</Link>
            <Link href="/validation" className="hover:text-fg transition-colors">Validation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
