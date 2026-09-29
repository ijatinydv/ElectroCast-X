"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-bg/80 backdrop-blur-xl border-b border-line shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-medium tracking-tight text-fg transition-opacity hover:opacity-90"
          >
            <span className="size-2 rounded-full bg-observed animate-pulse" />
            <span className="text-base font-semibold">ElectroCast-X</span>
          </Link>
          <span className="hidden sm:inline-block rounded-full bg-raised/80 px-2 py-0.5 text-[10px] font-mono text-fg-3 ring-1 ring-line">
            Odisha Pilot
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs text-fg-2 font-medium">
          <a href="#features" className="hover:text-fg transition-colors">
            When · Where · How Sure
          </a>
          <Link href="/how-it-works" className="hover:text-fg transition-colors">
            Architecture
          </Link>
          <Link href="/validation" className="hover:text-fg transition-colors">
            Validation
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/mission-control"
            className="group inline-flex h-8 items-center gap-1.5 rounded-full bg-fg px-3.5 text-xs font-medium text-bg hover:bg-fg/90 transition-all duration-200 shadow-sm"
          >
            <span>Launch Mission Control</span>
            <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
