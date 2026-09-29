import { describe, expect, it } from "vitest";
import { initialRailState } from "@/lib/mission-control";

describe("Mission Control responsive rails", () => {
  it("opens both rails only for the desktop layout", () => {
    expect(initialRailState(true)).toEqual({ leftOpen: true, rightOpen: true });
    expect(initialRailState(false)).toEqual({ leftOpen: false, rightOpen: false });
  });
});
