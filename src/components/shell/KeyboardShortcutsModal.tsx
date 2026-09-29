"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcutSections = [
  {
    category: "Playback & Timeline",
    items: [
      { keys: ["Space"], description: "Play or pause scenario playback" },
      { keys: ["←", "→"], description: "Step backward or forward one keyframe" },
      { keys: ["Home", "End"], description: "Jump directly to −60 min or +60 min" },
    ],
  },
  {
    category: "Scenarios",
    items: [
      { keys: ["1"], description: "Select Scenario A: First-flash initiation" },
      { keys: ["2"], description: "Select Scenario B: Severe electrified storm" },
      { keys: ["3"], description: "Select Scenario C: Sensor loss & uncertainty" },
    ],
  },
  {
    category: "Operational Tools",
    items: [
      { keys: ["X"], description: "Toggle Storm X-Ray (3D volume twin)" },
      { keys: ["W"], description: "Open Alert Composer sheet" },
      { keys: ["C"], description: "Toggle Prediction vs Actual swipe compare" },
      { keys: ["G"], description: "Run automated Guided Demo sequence" },
      { keys: ["?"], description: "Open this keyboard shortcuts HUD" },
      { keys: ["Esc"], description: "Close modal / sheet or halt guided demo" },
    ],
  },
];

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-line bg-rail/95 p-6 backdrop-blur-xl sm:rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-line pb-4">
          <DialogTitle className="text-base font-medium tracking-tight text-fg flex items-center justify-between">
            <span>Keyboard Shortcuts</span>
            <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-mono text-fg-2 ring-1 ring-line">Pro Nav</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-fg-2 mt-1">
            Accelerate your workflow with operational hotkeys across Mission Control.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcutSections.map((section) => (
            <div key={section.category}>
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-fg-3 mb-2.5">
                {section.category}
              </h4>
              <ul className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <li
                    key={item.description}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-raised/50 transition-colors"
                  >
                    <span className="text-fg-2">{item.description}</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="min-w-6 inline-flex h-5 items-center justify-center rounded border border-line-strong bg-raised px-1.5 font-mono text-[11px] font-medium text-fg shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
