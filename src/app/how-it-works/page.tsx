import { PipelineDiagram } from "@/components/pipeline/PipelineDiagram";

// presents the complete transparent model flow outside the operational workspace
export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-10 text-fg sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <PipelineDiagram />
      </div>
    </main>
  );
}
