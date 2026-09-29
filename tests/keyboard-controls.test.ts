import { describe, expect, it } from "vitest";
import { scrubberKeyTime } from "@/components/shell/BottomDock";

describe("time-machine keyboard controls", () => {
  const frames = [-60, -30, 0, 30, 60];

  it("moves among prepared frames and respects timeline endpoints", () => {
    expect(scrubberKeyTime(frames, 0, "ArrowLeft")).toBe(-30);
    expect(scrubberKeyTime(frames, 0, "ArrowRight")).toBe(30);
    expect(scrubberKeyTime(frames, 0, "Home")).toBe(-60);
    expect(scrubberKeyTime(frames, 0, "End")).toBe(60);
  });

  it("uses page keys for documented larger frame jumps", () => {
    expect(scrubberKeyTime(frames, -30, "PageUp")).toBe(30);
    expect(scrubberKeyTime(frames, 30, "PageDown")).toBe(-30);
    expect(scrubberKeyTime(frames, 0, "Enter")).toBeNull();
  });
});
