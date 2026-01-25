import { Court, DbCourt, mapDbCourtToCourt } from "@/src/types/db";
import { getSupabaseEnvStatus, supabase } from "@/src/services/supabase";

export type { Court } from "@/src/types/db";

export const MOCK_COURTS: Court[] = [
  {
    id: "123",
    name: "Mission Playground",
    latitude: 37.7596,
    longitude: -122.4148,
    address: "2450 Harrison St, San Francisco, CA",
    court_type: "outdoor",
    surface_type: "asphalt",
    number_of_hoops: 4,
    lighting: true,
    open_hours: "6am - 10pm",
    last_verified_at: "2024-05-10T18:00:00Z",
    created_at: "2024-01-10T18:00:00Z",
  },
  {
    id: "456",
    name: "Dolores Park Court",
    latitude: 37.7598,
    longitude: -122.4269,
    address: "Dolores St & 19th St, San Francisco, CA",
    court_type: "outdoor",
    surface_type: "concrete",
    number_of_hoops: 2,
    lighting: false,
    open_hours: "Sunrise - Sunset",
    last_verified_at: "2024-05-08T17:30:00Z",
    created_at: "2024-01-08T17:30:00Z",
  },
  {
    id: "789",
    name: "Panhandle Courts",
    latitude: 37.7716,
    longitude: -122.4481,
    address: "Fell St & Stanyan St, San Francisco, CA",
    court_type: "outdoor",
    surface_type: "asphalt",
    number_of_hoops: 6,
    lighting: true,
    open_hours: "6am - 11pm",
    last_verified_at: "2024-05-12T16:45:00Z",
    created_at: "2024-01-12T16:45:00Z",
  },
];

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export async function getCourtById(id: string): Promise<Court | null> {
  if (!id) {
    return null;
  }

  const fallback = MOCK_COURTS.find((court) => court.id === id) ?? null;

  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from("courts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      if (__DEV__ && error) {
        console.warn("Supabase getCourtById error:", error.message);
      }
      return fallback;
    }

    return mapDbCourtToCourt(data as DbCourt);
  } catch (err) {
    if (__DEV__) {
      console.warn("Supabase getCourtById failed:", err);
    }
    return fallback;
  }
}

export async function listCourtsNearby(
  lat: number,
  lon: number,
  radiusMeters: number
): Promise<Court[]> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    return MOCK_COURTS;
  }

  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos(toRadians(lat)) || 1);
  let rows: DbCourt[] | null = null;

  try {
    const { data, error } = await supabase
      .from("courts")
      .select("*")
      .gte("latitude", lat - latDelta)
      .lte("latitude", lat + latDelta)
      .gte("longitude", lon - lonDelta)
      .lte("longitude", lon + lonDelta)
      .limit(200);

    if (error) {
      if (__DEV__) {
        console.warn("Supabase listCourtsNearby error:", error.message);
      }
    } else {
      rows = data as DbCourt[];
    }
  } catch (err) {
    if (__DEV__) {
      console.warn("Supabase listCourtsNearby failed:", err);
    }
  }

  if (!rows) {
    // TODO: Prefer a PostGIS RPC like courts_nearby once available.
    try {
      const { data, error } = await supabase.rpc("courts_nearby", {
        lat,
        lon,
        radius_meters: radiusMeters,
      });

      if (error) {
        if (__DEV__) {
          console.warn("Supabase courts_nearby RPC error:", error.message);
        }
      } else {
        rows = data as DbCourt[];
      }
    } catch (err) {
      if (__DEV__) {
        console.warn("Supabase courts_nearby RPC failed:", err);
      }
    }
  }

  if (!rows) {
    return MOCK_COURTS;
  }

  const mapped = rows.map(mapDbCourtToCourt);
  const filtered = mapped.filter((court) => {
    if (court.latitude === null || court.longitude === null) {
      return false;
    }
    return (
      distanceMeters(lat, lon, court.latitude, court.longitude) <= radiusMeters
    );
  });

  return filtered.length > 0 ? filtered : mapped;
}

export function getMockCourts(): Court[] {
  return MOCK_COURTS;
}

export function formatCourtMeta(court: Court): string {
  const typeLabel = court.court_type
    ? `${court.court_type.charAt(0).toUpperCase()}${court.court_type.slice(1)}`
    : "Court";
  const hoops = court.number_of_hoops ?? "?";
  const lighting =
    court.lighting === null || court.lighting === undefined
      ? "Lighting unknown"
      : court.lighting
      ? "Lighting"
      : "No lighting";

  return `${typeLabel} • ${hoops} hoops • ${lighting}`;
}

export function formatLastVerified(court: Court): string | null {
  if (!court.last_verified_at) {
    return null;
  }

  const date = new Date(court.last_verified_at);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
