"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";

// lets callers choose whether reaching the final prepared minute starts a replay
export interface PlaybackOptions {
  loop?: boolean;
}

// limits global state writes while keeping the visual scenario clock responsive
const MAX_STORE_UPDATES_PER_SECOND = 30;

// defines the shortest allowable interval between shared-clock state writes
const STORE_UPDATE_INTERVAL_MS = 1_000 / MAX_STORE_UPDATES_PER_SECOND;

// advances the shared scenario clock without making animation frames trigger React renders
export function usePlayback({ loop = false }: PlaybackOptions = {}): void {
  const playing = useStore((state) => state.playing);
  const timeMin = useStore((state) => state.timeMin);
  const speed = useStore((state) => state.speed);
  const clockRef = useRef(timeMin);
  const speedRef = useRef(speed);

  clockRef.current = timeMin;
  speedRef.current = speed;

  useEffect(() => {
    if (!playing || document.visibilityState === "hidden") {
      return;
    }

    let animationFrameId = 0;
    let lastFrameAt: number | undefined;
    let lastStoreUpdateAt = -Infinity;

    const tick = (now: number) => {
      if (lastFrameAt !== undefined) {
        const elapsedScenarioMinutes = ((now - lastFrameAt) / 1_000) * speedRef.current;
        let nextTime = clockRef.current + elapsedScenarioMinutes;

        if (nextTime >= 60) {
          if (loop) {
            nextTime = -60 + (nextTime - 60);
          } else {
            clockRef.current = 60;
            useStore.getState().setTime(60);
            useStore.getState().setPlaying(false);
            return;
          }
        }

        clockRef.current = nextTime;
        if (now - lastStoreUpdateAt >= STORE_UPDATE_INTERVAL_MS) {
          useStore.getState().setTime(nextTime);
          lastStoreUpdateAt = now;
        }
      }

      lastFrameAt = now;
      animationFrameId = requestAnimationFrame(tick);
    };

    const pauseForHiddenTab = () => {
      if (document.visibilityState === "hidden") {
        useStore.getState().setPlaying(false);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", pauseForHiddenTab);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", pauseForHiddenTab);
    };
  }, [loop, playing]);
}
