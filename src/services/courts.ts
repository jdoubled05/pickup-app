import { isSupabaseConfigured, supabaseFetch } from "@/src/services/supabase";

export type Court = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  courtType?: string | null;
  surfaceType?: string | null;
  numberOfHoops?: number | null;
  lighting?: boolean | null;
  openHours?: string | null;
  lastVerifiedAt?: string | null;
};

const mockCourts: Court[] = [
  {
    id: "123",
    name: "Mission Playground",
    latitude: 37.7596,
    longitude: -122.4148,
    address: "2450 Harrison St, San Francisco, CA",
    courtType: "outdoor",
    surfaceType: "asphalt",
    numberOfHoops: 4,
    lighting: true,
    openHours: "6am - 10pm",
    lastVerifiedAt: "2024-05-10T18:00:00Z",
  },
  {
    id: "456",
    name: "Dolores Park Court",
    latitude: 37.7598,
    longitude: -122.4269,
    address: "Dolores St & 19th St, San Francisco, CA",
    courtType: "outdoor",
    surfaceType: "concrete",
    numberOfHoops: 2,
    lighting: false,
    openHours: "Sunrise - Sunset",
    lastVerifiedAt: "2024-05-08T17:30:00Z",
  },
];

export async function getCourtById(id: string) {
  if (!id) {
    return null;
  }

  const fallback = mockCourts.find((court) => court.id === id) ?? null;

  if (!isSupabaseConfigured) {
    return fallback;
  }

  try {
    const rows = await supabaseFetch<Court[]>(
      `/rest/v1/courts?id=eq.${encodeURIComponent(id)}&select=*`
    );
    return rows[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export async function listCourtsNearby(lat: number, lon: number, radiusMeters: number) {
  if (!isSupabaseConfigured) {
    return mockCourts;
  }

  try {
    const rows = await supabaseFetch<Court[]>("/rest/v1/courts?select=*");
    if (rows.length > 0) {
      return rows;
    }
  } catch {
    return mockCourts;
  }

  return mockCourts;
}
