import { describe, expect, it } from "vitest";
import { composeAlert } from "@/lib/i18n/alertTemplates";

describe("composeAlert", () => {
  it("fills only the supplied verified forecast fields in each prepared language", () => {
    const fields = { place: "Bhadrak", start: "4:19 pm IST", end: "4:31 pm IST" };

    expect(composeAlert("en", fields)).toBe("High lightning risk is expected near Bhadrak between 4:19 pm IST and 4:31 pm IST. Avoid open fields, rooftops, trees and metal structures.");
    expect(composeAlert("hi", fields)).toContain("Bhadrak के पास 4:19 pm IST से 4:31 pm IST");
    expect(composeAlert("od", fields)).toContain("Bhadrak ନିକଟରେ 4:19 pm IST ରୁ 4:31 pm IST");
  });
});
