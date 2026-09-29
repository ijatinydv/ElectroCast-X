"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-200 ${
        scrolled
          ? "border-b border-line bg-bg/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-medium tracking-wide text-fg hover:text-fg-2 transition-colors">
          <span className="size-2 rounded-full bg-observed" />
          <span>ElectroCast-X</span>
          <span className="rounded bg-raised px-1.5 py-0.5 text-[10px] font-mono text-fg-3 border border-line">ODISHA NOWCAST</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-fg-2">
          <a href="#when" className="hover:text-fg transition-colors">When</a>
          <a href="#where" className="hover:text-fg transition-colors">Where</a>
          <a href="#how-sure" className="hover:text-fg transition-colors">How Sure</a>
          <Link href="/how-it-works" className="hover:text-fg transition-colors">Pipeline</Link>
          <Link href="/validation" className="hover:text-fg transition-colors">Validation</Link>
        </nav>

        <Link
          href="/mission-control"
          className="inline-flex h-8 items-center rounded-md bg-fg px-4 text-xs font-medium text-bg hover:bg-fg/90 transition-colors"
        >
          Open Mission Control
        </Link>
      </div>
    </header>
  );
}
