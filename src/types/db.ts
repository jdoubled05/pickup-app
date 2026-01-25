export type Court = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  court_type: string | null;
  surface_type: string | null;
  number_of_hoops: number | null;
  lighting: boolean | null;
  open_hours: string | null;
  last_verified_at: string | null;
  created_at: string | null;
  distanceMeters?: number;
};

export type DbCourt = {
  id: string;
  name: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  court_type?: string | null;
  surface_type?: string | null;
  number_of_hoops?: number | null;
  lighting?: boolean | null;
  open_hours?: string | null;
  last_verified_at?: string | null;
  created_at?: string | null;
  location?: unknown | null;
  geom?: unknown | null;
};

export type DbCourtNearby = DbCourt & {
  latitude: number;
  longitude: number;
  distance_meters?: number | null;
};

type Coordinates = { latitude: number | null; longitude: number | null };

function parseGeoJsonPoint(value: unknown): Coordinates | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const point = value as { type?: unknown; coordinates?: unknown };
  if (point.type !== "Point" || !Array.isArray(point.coordinates)) {
    return null;
  }

  const [lon, lat] = point.coordinates;
  if (typeof lon !== "number" || typeof lat !== "number") {
    return null;
  }

  return { latitude: lat, longitude: lon };
}

function parseWktPoint(value: unknown): Coordinates | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match) {
    return null;
  }

  const longitude = Number(match[1]);
  const latitude = Number(match[2]);
  if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
    return null;
  }

  return { latitude, longitude };
}

function extractCoordinates(row: DbCourt): Coordinates {
  if (typeof row.latitude === "number" && typeof row.longitude === "number") {
    return { latitude: row.latitude, longitude: row.longitude };
  }

  const geoValue = row.location ?? row.geom;
  const geoJson = parseGeoJsonPoint(geoValue);
  if (geoJson) {
    return geoJson;
  }

  const wkt = parseWktPoint(geoValue);
  if (wkt) {
    return wkt;
  }

  // TODO: Add parsing for other PostGIS output formats if needed.
  return { latitude: null, longitude: null };
}

export function mapDbCourtToCourt(row: DbCourt): Court {
  const coords = extractCoordinates(row);
  const latitude = coords.latitude ?? Number.NaN;
  const longitude = coords.longitude ?? Number.NaN;

  return {
    id: row.id,
    name: row.name ?? "Unknown court",
    latitude,
    longitude,
    address: row.address ?? null,
    court_type: row.court_type ?? null,
    surface_type: row.surface_type ?? null,
    number_of_hoops: row.number_of_hoops ?? null,
    lighting: row.lighting ?? null,
    open_hours: row.open_hours ?? null,
    last_verified_at: row.last_verified_at ?? null,
    created_at: row.created_at ?? null,
  };
}

export function mapDbCourtNearbyToCourt(row: DbCourtNearby): Court {
  return {
    id: row.id,
    name: row.name ?? "Unknown court",
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address ?? null,
    court_type: row.court_type ?? null,
    surface_type: row.surface_type ?? null,
    number_of_hoops: row.number_of_hoops ?? null,
    lighting: row.lighting ?? null,
    open_hours: row.open_hours ?? null,
    last_verified_at: row.last_verified_at ?? null,
    created_at: row.created_at ?? null,
    distanceMeters:
      row.distance_meters === null || row.distance_meters === undefined
        ? undefined
        : row.distance_meters,
  };
}
