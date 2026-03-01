import {
  DbCourt,
  DbCourtNearby,
  mapDbCourtToCourt,
  mapDbCourtNearbyToCourt,
} from "@/src/types/db";
import { getSupabaseEnvStatus, supabase } from "@/src/services/supabase";
import { Court } from "@/src/types/courts";

export type { Court } from "@/src/types/courts";

export const MOCK_COURTS: Court[] = [
  {
    id: "123",
    name: "Mission Playground",
    description: "Neighborhood courts with pickup games most evenings.",
    location: null,
    latitude: 37.7596,
    longitude: -122.4148,
    address: "2450 Harrison St",
    city: "San Francisco",
    state: "CA",
    postal_code: "94110",
    country: "US",
    timezone: "America/Los_Angeles",
    indoor: false,
    surface_type: "asphalt",
    num_hoops: 4,
    lighting: true,
    open_24h: false,
    is_free: true,
    is_public: true,
    hours_json: { open: "06:00", close: "22:00" },
    amenities_json: ["lights", "restrooms"],
    photos_count: 3,
    created_at: "2024-01-10T18:00:00Z",
    updated_at: "2024-05-10T18:00:00Z",
    osm_type: null,
    osm_id: null,
    court_size: null,
  },
  {
    id: "456",
    name: "Dolores Park Court",
    description: "Popular outdoor courts near the park.",
    location: null,
    latitude: 37.7598,
    longitude: -122.4269,
    address: "Dolores St & 19th St",
    city: "San Francisco",
    state: "CA",
    postal_code: "94114",
    country: "US",
    timezone: "America/Los_Angeles",
    indoor: false,
    surface_type: "concrete",
    num_hoops: 2,
    lighting: false,
    open_24h: false,
    is_free: true,
    is_public: true,
    hours_json: { open: "sunrise", close: "sunset" },
    amenities_json: ["water"],
    photos_count: 2,
    created_at: "2024-01-08T17:30:00Z",
    updated_at: "2024-05-08T17:30:00Z",
    osm_type: null,
    osm_id: null,
    court_size: null,
  },
  {
    id: "789",
    name: "Panhandle Courts",
    description: "Larger run with multiple hoops.",
    location: null,
    latitude: 37.7716,
    longitude: -122.4481,
    address: "Fell St & Stanyan St",
    city: "San Francisco",
    state: "CA",
    postal_code: "94117",
    country: "US",
    timezone: "America/Los_Angeles",
    indoor: false,
    surface_type: "asphalt",
    num_hoops: 6,
    lighting: true,
    open_24h: false,
    is_free: null,
    is_public: true,
    hours_json: { open: "06:00", close: "23:00" },
    amenities_json: ["lights", "parking"],
    photos_count: 5,
    created_at: "2024-01-12T16:45:00Z",
    updated_at: "2024-05-12T16:45:00Z",
    osm_type: null,
    osm_id: null,
    court_size: null,
  },
];

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
    const rpcResponse = await supabase.rpc("court_by_id", { court_id: id });
    if (rpcResponse.data && !rpcResponse.error) {
      const rpcRow = Array.isArray(rpcResponse.data)
        ? rpcResponse.data[0]
        : rpcResponse.data;
      if (rpcRow) {
        return mapDbCourtNearbyToCourt(rpcRow as DbCourtNearby);
      }
    }
    return fallback;
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

  try {
    const { data, error } = await supabase.rpc("courts_nearby", {
      lat,
      lon,
      radius_meters: radiusMeters,
      limit_count: 100,
    });

    if (error) {
      if (__DEV__) {
        console.warn("Supabase courts_nearby RPC error:", error.message);
      }
      return MOCK_COURTS;
    }

    const rows = (data ?? []) as DbCourtNearby[];
    if (__DEV__ && rows.length === 0) {
      console.log("[courts] live query returned 0 rows", { lat, lon, radiusMeters });
    }

    return rows.map(mapDbCourtNearbyToCourt);
  } catch (err) {
    if (__DEV__) {
      console.warn("Supabase courts_nearby RPC failed:", err);
    }
    return MOCK_COURTS;
  }
}

export async function searchCourts(query: string): Promise<Court[]> {
  const envStatus = getSupabaseEnvStatus();
  if (!envStatus.configured || !supabase) {
    const q = query.toLowerCase();
    return MOCK_COURTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address ?? '').toLowerCase().includes(q) ||
        (c.city ?? '').toLowerCase().includes(q)
    );
  }

  try {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
      .limit(50);

    if (error) {
      if (__DEV__) console.warn('Supabase searchCourts error:', error.message);
      return [];
    }

    return (data ?? []).map((row) => mapDbCourtToCourt(row as DbCourt));
  } catch (err) {
    if (__DEV__) console.warn('Supabase searchCourts failed:', err);
    return [];
  }
}

export function getMockCourts(): Court[] {
  return MOCK_COURTS;
}

export function formatCourtMeta(court: Court): string {
  const lighting =
    court.lighting === null || court.lighting === undefined
      ? "Lighting unknown"
      : court.lighting
      ? "Lighting"
      : "No lighting";

  return `${formatIndoor(court.indoor)} • ${formatHoops(court.num_hoops)} • ${lighting}`;
}

export function formatIndoor(indoor: boolean | null): string {
  if (indoor === null || indoor === undefined) {
    return "Indoor/Outdoor unknown";
  }
  return indoor ? "Indoor" : "Outdoor";
}

export function formatHoops(num_hoops: number | null): string {
  if (num_hoops === null || num_hoops === undefined) {
    return "Hoops unknown";
  }
  return `${num_hoops} hoops`;
}

export function formatDistance(distance_meters?: number): string | null {
  if (distance_meters === null || distance_meters === undefined) {
    return null;
  }
  const miles = distance_meters / 1609.34;
  if (!Number.isFinite(miles)) {
    return null;
  }
  if (miles < 0.1) {
    return "<0.1 mi";
  }
  return `${miles.toFixed(1)} mi`;
}

export function formatAddress(court: Court): string {
  const parts = [
    court.address,
    court.city,
    court.state,
    court.postal_code,
  ].filter(Boolean);

  if (parts.length === 0) {
    return "Address unknown";
  }

  return parts.join(", ");
}

export function formatHours(hours_json: unknown | null): string {
  if (!hours_json) {
    return "Not provided";
  }
  if (typeof hours_json === "string") {
    return hours_json;
  }
  try {
    return JSON.stringify(hours_json);
  } catch {
    return "Not provided";
  }
}
