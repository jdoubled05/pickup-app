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
