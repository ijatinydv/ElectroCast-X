// defines the coordinate representation shared by the bundled Odisha boundaries
export type GeoJsonPosition = [longitude: number, latitude: number];

// describes the polygon geometry types used by the state boundary files
export type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: GeoJsonPosition[][] }
  | { type: "MultiPolygon"; coordinates: GeoJsonPosition[][][] };

// describes a GeoJSON feature without coupling it to a specific property set
export interface GeoJsonFeature<Properties> {
  type: "Feature";
  properties: Properties;
  geometry: GeoJsonGeometry;
}

// provides a reusable collection shape for the bundled boundary datasets
export interface GeoJsonFeatureCollection<Properties> {
  type: "FeatureCollection";
  features: GeoJsonFeature<Properties>[];
}

// retains the district identifiers supplied by the Odisha boundary source
export interface OdishaDistrictProperties {
  dt_code: string;
  district: string;
  st_code: string;
  year: string;
  st_nm: string;
}

// exposes the state name attached to the dissolved outer boundary
export interface OdishaStateProperties {
  st_nm: string;
}
