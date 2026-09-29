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
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#070b12]/80 backdrop-blur-xl shadow-lg shadow-black/40"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-white hover:opacity-90 transition-opacity">
          <span className="size-2 rounded-full bg-[#4fd8eb] animate-pulse" />
          <span>ElectroCast-X</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#86868b]">
          <a href="#when" className="hover:text-white transition-colors">When</a>
          <a href="#where" className="hover:text-white transition-colors">Where</a>
          <a href="#how-sure" className="hover:text-white transition-colors">How Sure</a>
          <Link href="/how-it-works" className="hover:text-white transition-colors">Pipeline</Link>
          <Link href="/validation" className="hover:text-white transition-colors">Validation</Link>
        </nav>

        <Link
          href="/mission-control"
          className="inline-flex h-8 items-center rounded-full bg-white px-4 text-xs font-medium text-black hover:bg-white/90 transition-all shadow-sm"
        >
          Open Mission Control
        </Link>
      </div>
    </header>
  );
}
