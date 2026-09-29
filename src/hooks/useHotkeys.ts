"use client";

import { useEffect } from "react";

// defines the playback and operational actions supported by shared keyboard controls
export interface HotkeyHandlers {
  onTogglePlayback?: () => void;
  onStepBackward?: () => void;
  onStepForward?: () => void;
  onSelectScenarioA?: () => void;
  onSelectScenarioB?: () => void;
  onSelectScenarioC?: () => void;
  onToggleXRay?: () => void;
  onToggleAlert?: () => void;
  onToggleCompare?: () => void;
  onToggleGuide?: () => void;
  onToggleShortcuts?: () => void;
}

// keeps timeline and operational keyboard commands consistent without stealing text-entry shortcuts
export function useHotkeys(handlers: HotkeyHandlers): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"))) {
        return;
      }

      if (event.code === "Space" && handlers.onTogglePlayback) {
        event.preventDefault();
        handlers.onTogglePlayback();
      } else if (event.key === "ArrowLeft" && handlers.onStepBackward) {
        event.preventDefault();
        handlers.onStepBackward();
      } else if (event.key === "ArrowRight" && handlers.onStepForward) {
        event.preventDefault();
        handlers.onStepForward();
      } else if (event.key === "1" && handlers.onSelectScenarioA) {
        event.preventDefault();
        handlers.onSelectScenarioA();
      } else if (event.key === "2" && handlers.onSelectScenarioB) {
        event.preventDefault();
        handlers.onSelectScenarioB();
      } else if (event.key === "3" && handlers.onSelectScenarioC) {
        event.preventDefault();
        handlers.onSelectScenarioC();
      } else if ((event.key === "x" || event.key === "X") && handlers.onToggleXRay) {
        event.preventDefault();
        handlers.onToggleXRay();
      } else if ((event.key === "w" || event.key === "W") && handlers.onToggleAlert) {
        event.preventDefault();
        handlers.onToggleAlert();
      } else if ((event.key === "c" || event.key === "C") && handlers.onToggleCompare) {
        event.preventDefault();
        handlers.onToggleCompare();
      } else if ((event.key === "g" || event.key === "G") && handlers.onToggleGuide) {
        event.preventDefault();
        handlers.onToggleGuide();
      } else if (event.key === "?" && handlers.onToggleShortcuts) {
        event.preventDefault();
        handlers.onToggleShortcuts();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
