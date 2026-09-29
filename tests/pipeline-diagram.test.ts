import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import pipeline from "@/data/content/pipeline.json";
import { PipelineDiagram } from "@/components/pipeline/PipelineDiagram";

// renders the technical flow without browser animation so its published stages remain inspectable
function pipelineMarkup(): string {
  return renderToStaticMarkup(createElement(PipelineDiagram));
}

describe("PipelineDiagram", () => {
  it("shows all declared observation, forecast, and operational stages", () => {
    const markup = pipelineMarkup();

    for (const item of [...pipeline.sources, ...pipeline.stages]) {
      expect(markup).toContain(item.title);
    }
    expect(markup).toContain("Risk corridors");
    expect(markup).toContain("Evidence");
    expect(markup).toContain("Alerts");
  });

  it("starts with a Mission Control link for the focused forecast stage", () => {
    expect(pipelineMarkup()).toContain("See it in Mission Control: Sensor health");
  });
});
