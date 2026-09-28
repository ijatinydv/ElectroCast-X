export interface AssetLocation {
  id: string;
  name: string;
  lonLat: [number, number];
  type: "village" | "school" | "hospital" | "airport" | "mine" | "event";
  population?: number;
  synthetic: boolean;
}

export interface PolylineAsset {
  id: string;
  name: string;
  path: [number, number][];
  type: "transmission";
  synthetic: boolean;
}

export interface SyntheticAssets {
  points: AssetLocation[];
  polylines: PolylineAsset[];
}
