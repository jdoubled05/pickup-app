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
};

const MOCK_COURTS: Court[] = [
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

export async function getCourtById(id: string): Promise<Court | null> {
  if (!id) {
    return null;
  }

  const fallback = MOCK_COURTS.find((court) => court.id === id) ?? null;

  // TODO: Replace with Supabase query once the courts table is live.
  // const { data, error } = await supabase.from("courts").select("*").eq("id", id).single();
  // if (error) return fallback;
  // return data ?? fallback;
  return fallback;
}

export async function listCourtsNearby(
  lat: number,
  lon: number,
  radiusMeters: number
): Promise<Court[]> {
  // TODO: Replace with Supabase RPC for geo queries once PostGIS is enabled.
  // const { data, error } = await supabase.rpc("courts_nearby", { lat, lon, radius_meters: radiusMeters });
  // if (error) return MOCK_COURTS;
  // return data ?? MOCK_COURTS;
  return MOCK_COURTS;
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
