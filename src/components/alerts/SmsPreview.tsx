import type { AlertLanguage } from "@/lib/i18n/alertTemplates";

// describes the SMS transport limits displayed beside a composed alert
export interface SmsSegmentStats {
  characters: number;
  segmentLimit: number;
  segments: number;
}

// calculates language-appropriate SMS capacity without changing the composed alert text
export function smsSegmentStats(text: string, language: AlertLanguage): SmsSegmentStats {
  const segmentLimit = language === "en" ? 160 : 70;
  const characters = Array.from(text).length;
  return {
    characters,
    segmentLimit,
    segments: Math.max(1, Math.ceil(characters / segmentLimit)),
  };
}

// renders the composed alert as a clearly labelled demo SMS message
export function SmsPreview({ text, language }: { text: string; language: AlertLanguage }) {
  const { characters, segmentLimit, segments } = smsSegmentStats(text, language);

  return (
    <section aria-label="SMS preview" className="border border-line bg-bg p-4">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <p className="text-sm font-medium text-fg">ElectroCast-X demo</p>
        <p className="text-xs text-fg-2">SMS preview</p>
      </div>
      <p lang={language === "en" ? "en" : language === "hi" ? "hi" : "or"} className={`mt-4 max-w-md rounded-md bg-raised px-4 py-3 text-sm leading-6 text-fg ${language === "hi" ? "font-[Noto_Sans_Devanagari]" : language === "od" ? "font-[Noto_Sans_Oriya]" : ""}`}>{text}</p>
      <p className="num mt-3 text-xs text-fg-2">{characters} characters / {segmentLimit} · {segments} {segments === 1 ? "segment" : "segments"}</p>
    </section>
  );
}
