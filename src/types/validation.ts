// defines the prepared illustrative values rendered by the validation route
export interface ValidationPlaceholder {
  label: "illustrative placeholder";
  reliability: {
    forecastProbability: number[];
    observedFrequency: number[];
  };
  skill: {
    leadMinutes: number[];
    pod: number[];
    far: number[];
    csi: number[];
    brier: number[];
  };
}
