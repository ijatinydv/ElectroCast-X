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
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-observed">ElectroCast-X <span className="ml-2 rounded-full bg-observed/16 px-2 py-0.5 text-[11px] text-observed ring-1 ring-observed/30">Simulated demo scenario</span></p>
            <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">Illustrative validation</h1>
            <p className="mt-3 text-base leading-7 text-fg-2">These values are not results. They show the intended validation views for calibrated first-flash forecasts.</p>
          </div>
          <Link href="/mission-control" className="text-sm text-fg-2 underline decoration-line-strong underline-offset-4 hover:text-fg">Open Mission Control</Link>
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
