import Link from "next/link";
import { PipelineDiagram } from "@/components/pipeline/PipelineDiagram";

export const metadata = {
  title: "Architecture — ElectroCast-X",
  description: "Multimodal lightning nowcast data pipeline architecture.",
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      {/* Top operational bar */}
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/mission-control"
            className="group inline-flex items-center gap-2 rounded border border-line bg-raised/50 px-3 py-1 text-xs font-medium text-fg-2 hover:border-line-strong hover:text-fg hover:bg-raised transition-all"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:-translate-x-0.5"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span>Back to Mission Control</span>
          </Link>
          <span className="hidden sm:inline-flex text-[11px] font-mono text-fg-3">
            Simulated demo scenario
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link href="/" className="text-fg-3 hover:text-fg transition-colors">
            Home
          </Link>
          <span className="text-line-strong">/</span>
          <span className="text-fg font-medium">Architecture</span>
          <span className="text-line-strong">/</span>
          <Link href="/validation" className="text-fg-3 hover:text-fg transition-colors">
            Validation
          </Link>
        </div>
      </header>

      {/* Main Container - Centered, compact, fits in standard viewport */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <PipelineDiagram />
      </div>
    </main>
  );
}
