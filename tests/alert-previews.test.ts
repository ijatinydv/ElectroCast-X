import { describe, expect, it } from "vitest";
import { smsSegmentStats } from "@/components/alerts/SmsPreview";

// verifies the visible SMS counters use the documented GSM-7 and UCS-2 limits
describe("smsSegmentStats", () => {
  it("uses the 160-character GSM-7 limit for English alerts", () => {
    expect(smsSegmentStats("a".repeat(160), "en")).toEqual({ characters: 160, segmentLimit: 160, segments: 1 });
    expect(smsSegmentStats("a".repeat(161), "en").segments).toBe(2);
  });

  it("uses the 70-character UCS-2 limit for Hindi and Odia alerts", () => {
    expect(smsSegmentStats("ब".repeat(70), "hi")).toEqual({ characters: 70, segmentLimit: 70, segments: 1 });
    expect(smsSegmentStats("ବ".repeat(71), "od").segments).toBe(2);
  });
});
