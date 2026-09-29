import Link from "next/link";
import { PipelineDiagram } from "@/components/pipeline/PipelineDiagram";

// presents the complete transparent model flow with back navigation
export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur-xl sm:px-8 lg:px-12">
        <Link
          href="/mission-control"
          className="group inline-flex items-center gap-2 rounded-full border border-line bg-raised/50 px-3.5 py-1.5 text-xs font-medium text-fg-2 hover:border-line-strong hover:text-fg hover:bg-raised transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          <span>Back to Mission Control</span>
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <Link href="/" className="text-fg-3 hover:text-fg transition-colors">
            Home
          </Link>
          <span className="text-line-strong">/</span>
          <span className="text-fg font-medium">Architecture</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 lg:px-12">
        <PipelineDiagram />
      </div>
    </main>
  );
}
