import * as Location from "expo-location";

export type LatLon = { lat: number; lon: number };

/**
 * Geocode a free-text address/place query to coordinates using Nominatim.
 * Returns null if no result found or on network error.
 */
export async function geocodeAddress(query: string): Promise<LatLon | null> {
  try {
    const trimmed = query.trim();
    const isZip = /^\d{5}(-\d{4})?$/.test(trimmed);

    // Use postalcode param for ZIP codes so Nominatim matches them precisely
    const params = isZip
      ? `postalcode=${encodeURIComponent(trimmed)}&countrycodes=us&format=json&limit=1`
      : `q=${encodeURIComponent(trimmed)}&countrycodes=us&format=json&limit=1`;

    const url = `https://nominatim.openstreetmap.org/search?${params}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "PickupApp/1.0" },
    });
    if (!response.ok) return null;
    const results = await response.json() as Array<{ lat: string; lon: string }>;
    if (!results.length) return null;
    return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

export type CitySuggestion = {
  description: string; // e.g. "Atlanta, Georgia, United States"
  displayName: string; // e.g. "Atlanta, GA"
  coords: LatLon;
};

export const STATE_ABBREVS: Record<string, string> = {
  alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west virginia':'WV',wisconsin:'WI',wyoming:'WY',
};

type NominatimResult = {
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    county?: string;
  };
  display_name?: string;
};

/**
 * Autocomplete city suggestions using Nominatim (OpenStreetMap).
 * Pass an optional `bias` coordinate to rank geographically nearby results first.
 */
export async function autocompleteCities(query: string, bias?: LatLon): Promise<CitySuggestion[]> {
  if (query.trim().length < 1) return [];
  try {
    // Nominatim viewbox biases results toward the user's current area without excluding others
    const viewboxParam = bias
      ? `&viewbox=${bias.lon - 5},${bias.lat - 5},${bias.lon + 5},${bias.lat + 5}&bounded=0`
      : '';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=us&limit=5${viewboxParam}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PickupApp/1.0' } });
    if (!res.ok) return [];
    const results = await res.json() as NominatimResult[];
    const seen = new Set<string>();
    const suggestions: CitySuggestion[] = [];
    for (const r of results) {
      const addr = r.address ?? {};
      const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? '';
      if (!city) continue;
      const stateKey = (addr.state ?? '').toLowerCase();
      const stateAbbrev = STATE_ABBREVS[stateKey] ?? addr.state ?? '';
      const displayName = stateAbbrev ? `${city}, ${stateAbbrev}` : city;
      if (seen.has(displayName.toLowerCase())) continue;
      seen.add(displayName.toLowerCase());
      suggestions.push({
        description: r.display_name ?? displayName,
        displayName,
        coords: { lat: parseFloat(r.lat), lon: parseFloat(r.lon) },
      });
    }
    return suggestions.slice(0, 3);
  } catch {
    return [];
  }
}

export const DEFAULT_CENTER: LatLon = { lat: 33.749, lon: -84.388 };

export async function getForegroundLocationOrDefault(): Promise<{
  coords: LatLon;
  source: "device" | "default";
  error?: string;
}> {
  try {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return {
          coords: DEFAULT_CENTER,
          source: "default",
          error: "Location permission not granted.",
        };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        coords: { lat: position.coords.latitude, lon: position.coords.longitude },
        source: "device",
      };
    } catch (err) {
      return {
        coords: DEFAULT_CENTER,
        source: "default",
        error: err instanceof Error ? err.message : "expo-location unavailable.",
      };
    }
  } catch (err) {
    return {
      coords: DEFAULT_CENTER,
      source: "default",
      error: err instanceof Error ? err.message : "Failed to read location.",
    };
  }
}
