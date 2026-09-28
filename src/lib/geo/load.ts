import odishaDistrictsJson from "@/data/geo/odisha-districts.json";
import odishaStateJson from "@/data/geo/odisha-state.json";
import syntheticAssetsJson from "@/data/assets/synthetic-assets.json";
import type { SyntheticAssets } from "@/types/assets";
import type {
  GeoJsonFeatureCollection,
  OdishaDistrictProperties,
  OdishaStateProperties,
} from "@/types/geo";

// returns the district boundaries with their source properties intact
export function getOdishaDistricts(): GeoJsonFeatureCollection<OdishaDistrictProperties> {
  return odishaDistrictsJson as unknown as GeoJsonFeatureCollection<OdishaDistrictProperties>;
}

// returns the dissolved state outline for map framing and fills
export function getOdishaState(): GeoJsonFeatureCollection<OdishaStateProperties> {
  return odishaStateJson as unknown as GeoJsonFeatureCollection<OdishaStateProperties>;
}

// returns the seeded demo exposure records with their asset domain types
export function getSyntheticAssets(): SyntheticAssets {
  return syntheticAssetsJson as SyntheticAssets;
}
