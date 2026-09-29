"use client";

import { useEffect, useMemo, useState } from "react";
import { geoCentroid, geoContains } from "d3-geo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhonePreview } from "@/components/alerts/PhonePreview";
import { SmsPreview } from "@/components/alerts/SmsPreview";
import { getOdishaDistricts } from "@/lib/geo/load";
import { composeAlert, type AlertLanguage, type AlertTemplateFields } from "@/lib/i18n/alertTemplates";
import { frameAt } from "@/lib/map/interpolate";
import { useStore } from "@/store/useStore";
import type { Cell, Scenario } from "@/types/scenario";
import scenarioA from "@/data/scenarios/a-first-flash.json";
import scenarioB from "@/data/scenarios/b-severe-storm.json";
import scenarioC from "@/data/scenarios/c-sensor-loss.json";

// keeps the prepared fixtures local to the composer without requesting runtime data
const scenarios: Record<Scenario["id"], Scenario> = {
  A: scenarioA as unknown as Scenario,
  B: scenarioB as unknown as Scenario,
  C: scenarioC as unknown as Scenario,
};

// presents language labels in their own script as specified for the composer tabs
const languages: readonly { id: AlertLanguage; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी" },
  { id: "od", label: "ଓଡ଼ିଆ" },
];

// derives an operator-recognisable district from the selected cell's prepared forecast region
function nearestDistrictName(cell: Cell): string {
  const region = cell.firstFlash?.region ?? cell.corridors["30"].inner;
  const polygon = { type: "Polygon" as const, coordinates: [region] };
  const centroid = geoCentroid(polygon);
  const districts = getOdishaDistricts().features;
  const containingDistrict = districts.find((district) => geoContains(district as never, centroid));
  if (containingDistrict) return containingDistrict.properties.district;
  const nearestDistrict = districts.reduce((closest, district) => {
    const [closestLongitude, closestLatitude] = geoCentroid(closest as never);
    const [districtLongitude, districtLatitude] = geoCentroid(district as never);
    const closestDistance = (closestLongitude - centroid[0]) ** 2 + (closestLatitude - centroid[1]) ** 2;
    const districtDistance = (districtLongitude - centroid[0]) ** 2 + (districtLatitude - centroid[1]) ** 2;
    return districtDistance < closestDistance ? district : closest;
  });
  return nearestDistrict?.properties.district ?? "Forecast region";
}

// formats the scenario's prepared IST reference time for the operator-facing warning text
function formatIstTime(t0IsoIst: string, minutes: number): string {
  const date = new Date(new Date(t0IsoIst).getTime() + minutes * 60_000);
  return `${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true }).format(date)} IST`;
}

// supplies the verified countdown range used to prefill editable warning timing fields
function alertFields(scenario: Scenario, cell: Cell): AlertTemplateFields {
  const [startMinute, endMinute] = cell.firstFlash?.windowMin ?? [15, 30];
  return {
    place: nearestDistrictName(cell),
    start: formatIstTime(scenario.t0IsoIst, startMinute),
    end: formatIstTime(scenario.t0IsoIst, endMinute),
  };
}

// renders the warning composer from shared scenario, selected-cell, and timeline state
export function AlertComposer() {
  const alertOpen = useStore((state) => state.panels.alert);
  const scenarioId = useStore((state) => state.scenarioId);
  const timeMin = useStore((state) => state.timeMin);
  const selectedCellId = useStore((state) => state.selectedCellId);
  const horizon = useStore((state) => state.horizon);
  const setHorizon = useStore((state) => state.setHorizon);
  const setPanel = useStore((state) => state.setPanel);
  const issueWarning = useStore((state) => state.issueWarning);
  const [language, setLanguage] = useState<AlertLanguage>("en");
  const [preview, setPreview] = useState<"sms" | "notification">("sms");
  const [fields, setFields] = useState<AlertTemplateFields>({ place: "", start: "", end: "" });
  const [toast, setToast] = useState<string | null>(null);
  const scenario = scenarios[scenarioId];
  const cell = selectedCellId ? frameAt(scenario, timeMin).cells.find((candidate) => candidate.id === selectedCellId) : undefined;

  useEffect(() => {
    if (!alertOpen) return;
    void import("@fontsource/noto-sans-devanagari/400.css");
    void import("@fontsource/noto-sans-oriya/400.css");
    if (cell) setFields(alertFields(scenario, cell));
  }, [alertOpen, scenarioId, selectedCellId]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const text = useMemo(() => composeAlert(language, fields), [fields, language]);

  // commits a timeline marker only after the prepared alert has a selected forecast cell
  const issue = () => {
    if (!cell) return;
    issueWarning({ tMin: timeMin, cellId: cell.id, horizon });
    setToast(`Warning issued for ${fields.place}`);
    setPanel("alert", false);
  };

  return (
    <>
      <Sheet open={alertOpen} onOpenChange={(open) => setPanel("alert", open)}>
        <SheetContent side="right" className="flex w-full max-w-xl flex-col border-line bg-rail p-0 text-fg sm:max-w-xl">
          <SheetHeader className="border-b border-line p-5">
            <SheetTitle>Create warning</SheetTitle>
            <SheetDescription>Prepared forecast fields can be reviewed before issue.</SheetDescription>
          </SheetHeader>
          {cell ? <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Warning corridor</legend>
              <div className="grid grid-cols-3 rounded-md border border-line p-1">
                {([15, 30, 60] as const).map((value) => <button key={value} type="button" aria-pressed={horizon === value} onClick={() => setHorizon(value)} className={horizon === value ? "rounded-sm bg-risk px-2 py-2 text-sm font-medium text-bg" : "rounded-sm px-2 py-2 text-sm text-fg-2 hover:text-fg"}><span className="num">{value}</span> min</button>)}
              </div>
              <p className="mt-2 text-xs text-fg-2">Inner corridor highlighted on the map.</p>
            </fieldset>
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium">Place<input value={fields.place} onChange={(event) => setFields((current) => ({ ...current, place: event.target.value }))} className="h-9 border border-line bg-bg px-3 text-sm text-fg outline-none focus-visible:border-risk focus-visible:ring-2 focus-visible:ring-risk/30" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium">Start<input value={fields.start} onChange={(event) => setFields((current) => ({ ...current, start: event.target.value }))} className="num h-9 border border-line bg-bg px-3 text-sm text-fg outline-none focus-visible:border-risk focus-visible:ring-2 focus-visible:ring-risk/30" /></label>
                <label className="grid gap-1.5 text-sm font-medium">End<input value={fields.end} onChange={(event) => setFields((current) => ({ ...current, end: event.target.value }))} className="num h-9 border border-line bg-bg px-3 text-sm text-fg outline-none focus-visible:border-risk focus-visible:ring-2 focus-visible:ring-risk/30" /></label>
              </div>
            </div>
            <Tabs value={language} onValueChange={(value) => setLanguage(value as AlertLanguage)} className="flex min-h-0 flex-1 flex-col">
              <TabsList className="grid grid-cols-3 bg-raised">
                {languages.map(({ id, label }) => <TabsTrigger key={id} value={id}>{label}</TabsTrigger>)}
              </TabsList>
              {languages.map(({ id }) => <TabsContent key={id} value={id} className="mt-4 border border-line bg-bg p-4 text-sm leading-6 text-fg"><p lang={id === "en" ? "en" : id === "hi" ? "hi" : "or"} className={id === "hi" ? "font-[Noto_Sans_Devanagari]" : id === "od" ? "font-[Noto_Sans_Oriya]" : undefined}>{text}</p></TabsContent>)}
            </Tabs>
            <Tabs value={preview} onValueChange={(value) => setPreview(value as "sms" | "notification")}>
              <TabsList className="grid w-full grid-cols-2 bg-raised">
                <TabsTrigger value="sms">SMS preview</TabsTrigger>
                <TabsTrigger value="notification">Mobile notification</TabsTrigger>
              </TabsList>
              <TabsContent value="sms" className="mt-4"><SmsPreview text={text} language={language} /></TabsContent>
              <TabsContent value="notification" className="mt-4"><PhonePreview text={text} language={language} isActive={preview === "notification"} /></TabsContent>
            </Tabs>
          </div> : <div className="p-5 text-sm text-fg-2">Select a storm cell on the map.</div>}
          <SheetFooter className="border-t border-line p-5">
            <p className="text-xs text-fg-2">Text composed from verified forecast fields. LLM-verbalised (pre-generated).</p>
            <Button disabled={!cell} onClick={issue} className="w-full bg-risk text-bg hover:bg-risk/90">Issue warning</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {toast && <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-risk bg-rail px-4 py-3 text-sm text-fg shadow-none">{toast}</div>}
    </>
  );
}
