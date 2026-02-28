import { Court } from "@/src/types/courts";

export type DbCourt = Omit<Court, "latitude" | "longitude" | "distance_meters"> & {
  latitude?: number | null;
  longitude?: number | null;
  distance_meters?: number | null;
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
  const latitude = coords.latitude ?? undefined;
  const longitude = coords.longitude ?? undefined;
  const locationValue = typeof row.location === "string" ? row.location : null;

  return {
    id: row.id,
    name: row.name ?? "Unknown court",
    description: row.description ?? null,
    location: locationValue,
    address: row.address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    postal_code: row.postal_code ?? null,
    country: row.country ?? null,
    timezone: row.timezone ?? null,
    indoor: row.indoor ?? null,
    surface_type: row.surface_type ?? null,
    num_hoops: row.num_hoops ?? null,
    lighting: row.lighting ?? null,
    open_24h: row.open_24h ?? null,
    is_free: row.is_free ?? null,
    is_public: row.is_public ?? null,
    hours_json: row.hours_json ?? null,
    amenities_json: row.amenities_json ?? null,
    photos_count: row.photos_count ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    osm_type: row.osm_type ?? null,
    osm_id: row.osm_id ?? null,
    latitude,
    longitude,
  };
}

export function mapDbCourtNearbyToCourt(row: DbCourtNearby): Court {
  const locationValue = typeof row.location === "string" ? row.location : null;

  return {
    id: row.id,
    name: row.name ?? "Unknown court",
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.description ?? null,
    location: locationValue,
    address: row.address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    postal_code: row.postal_code ?? null,
    country: row.country ?? null,
    timezone: row.timezone ?? null,
    indoor: row.indoor ?? null,
    surface_type: row.surface_type ?? null,
    num_hoops: row.num_hoops ?? null,
    lighting: row.lighting ?? null,
    open_24h: row.open_24h ?? null,
    is_free: row.is_free ?? null,
    is_public: row.is_public ?? null,
    hours_json: row.hours_json ?? null,
    amenities_json: row.amenities_json ?? null,
    photos_count: row.photos_count ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    osm_type: row.osm_type ?? null,
    osm_id: row.osm_id ?? null,
    distance_meters:
      row.distance_meters === null || row.distance_meters === undefined
        ? undefined
        : row.distance_meters,
  };
}
