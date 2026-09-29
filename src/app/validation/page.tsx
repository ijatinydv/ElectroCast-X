import Link from "next/link";
import { ReliabilityChart } from "@/components/validation/ReliabilityChart";
import { SkillChart } from "@/components/validation/SkillChart";
import validationPlaceholder from "@/data/content/validation-placeholder.json";
import type { ValidationPlaceholder } from "@/types/validation";

// preserves the declared validation-data contract when importing the prepared JSON fixture
const validation = validationPlaceholder as ValidationPlaceholder;

// fails early if a prepared table metric is missing from the illustrative fixture
function metricAt(values: number[], index: number): number {
  const value = values[index];
  if (value === undefined) throw new Error("Validation placeholder metrics must cover every lead time");
  return value;
}

// presents clearly labelled illustrative validation patterns outside Mission Control
export default function ValidationPage() {
  const rows = validation.skill.leadMinutes.map((leadMinutes, index) => ({
    leadMinutes,
    pod: metricAt(validation.skill.pod, index),
    far: metricAt(validation.skill.far, index),
    csi: metricAt(validation.skill.csi, index),
    brier: metricAt(validation.skill.brier, index),
  }));

  return (
    <main className="min-h-svh bg-bg px-5 py-8 text-fg sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
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
            <span className="text-fg font-medium">Validation</span>
          </div>
        </div>

        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-fg-2">ElectroCast-X <span className="ml-2 rounded-full bg-rail px-2 py-0.5 text-[11px] text-fg-2 ring-1 ring-line">Simulated demo scenario</span></p>
            <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">Illustrative validation</h1>
            <p className="mt-3 text-base leading-7 text-fg-2">These values are not results. They show the intended validation views for calibrated first-flash forecasts.</p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ReliabilityChart {...validation.reliability} label={validation.label} />
          <SkillChart {...validation.skill} label={validation.label} />
        </div>

        <section className="mt-6 border border-line bg-panel" aria-labelledby="validation-table-title">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4">
            <div>
              <h2 id="validation-table-title" className="text-sm font-medium text-fg">Lead-time skill summary</h2>
              <p className="mt-1 text-xs leading-5 text-fg-2">Prepared values shown only to demonstrate the table treatment.</p>
            </div>
            <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-fg-2 ring-1 ring-line">{validation.label}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-line text-xs font-medium text-fg-2">
                <tr>
                  <th scope="col" className="px-4 py-3">Lead time</th>
                  <th scope="col" className="px-4 py-3">POD</th>
                  <th scope="col" className="px-4 py-3">FAR</th>
                  <th scope="col" className="px-4 py-3">CSI</th>
                  <th scope="col" className="px-4 py-3">Brier</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-fg-2">
                {rows.map((row) => (
                  <tr key={row.leadMinutes}>
                    <th scope="row" className="num px-4 py-3 font-medium text-fg">{row.leadMinutes} min</th>
                    <td className="num px-4 py-3">{row.pod.toFixed(2)}</td>
                    <td className="num px-4 py-3">{row.far.toFixed(2)}</td>
                    <td className="num px-4 py-3">{row.csi.toFixed(2)}</td>
                    <td className="num px-4 py-3">{row.brier.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-fg-2 ring-1 ring-line">{validation.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
