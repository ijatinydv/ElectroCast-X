"use client";

import { useEffect } from "react";

// defines the playback actions supported by shared keyboard controls
export interface HotkeyHandlers {
  onTogglePlayback: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
}

// keeps timeline keyboard commands consistent without stealing text-entry shortcuts
export function useHotkeys({ onTogglePlayback, onStepBackward, onStepForward }: HotkeyHandlers): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.matches("input, textarea, select, [role='textbox']"))) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        onTogglePlayback();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onStepBackward();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onStepForward();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onStepBackward, onStepForward, onTogglePlayback]);
}
