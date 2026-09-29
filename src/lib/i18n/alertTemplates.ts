import templates from "@/data/content/alerts.json";

// identifies the three prepared message variants available to warning operators
export type AlertLanguage = "en" | "hi" | "od";

// limits template interpolation to verified forecast fields editable in the composer
export interface AlertTemplateFields {
  place: string;
  start: string;
  end: string;
}

// fills a prepared warning template without introducing language-model-generated content
export function composeAlert(language: AlertLanguage, fields: AlertTemplateFields): string {
  return templates[language]
    .replace("{place}", fields.place)
    .replace("{start}", fields.start)
    .replace("{end}", fields.end);
}
