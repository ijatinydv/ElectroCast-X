"use client";

import { Zap } from "lucide-react";
import { m } from "motion/react";
import type { AlertLanguage } from "@/lib/i18n/alertTemplates";

// displays a flat lock-screen notification from the currently composed alert text
export function PhonePreview({ text, language, isActive }: { text: string; language: AlertLanguage; isActive: boolean }) {
  return (
    <section aria-label="Mobile notification preview" className="mx-auto w-full max-w-[290px] rounded-[1.5rem] border-2 border-line-strong bg-bg p-2 shadow-none">
      <div className="min-h-[410px] overflow-hidden rounded-[1rem] border border-line bg-rail p-3">
        <div className="mx-auto h-1.5 w-16 rounded-full bg-line-strong" aria-hidden="true" />
        <p className="mt-5 text-center text-xs text-fg-3">Lock screen preview</p>
        {isActive && <m.article initial={{ opacity: 0, y: -28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }} className="mt-28 border border-line-strong bg-raised p-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-sm bg-risk text-bg"><Zap className="size-4 fill-current" /></span>
            <p className="text-xs font-medium text-fg">ElectroCast-X</p>
            <time className="ml-auto text-xs text-fg-2">now</time>
          </div>
          <h3 className="mt-3 text-sm font-medium text-fg">Lightning warning</h3>
          <p lang={language === "en" ? "en" : language === "hi" ? "hi" : "or"} className={`mt-1 line-clamp-2 text-xs leading-5 text-fg-2 ${language === "hi" ? "font-[Noto_Sans_Devanagari]" : language === "od" ? "font-[Noto_Sans_Oriya]" : ""}`}>{text}</p>
        </m.article>}
      </div>
    </section>
  );
}
