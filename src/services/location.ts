import * as Location from "expo-location";

export type LatLon = { lat: number; lon: number };

export const DEFAULT_CENTER: LatLon = { lat: 33.749, lon: -84.388 };

export async function getForegroundLocationOrDefault(): Promise<{
  coords: LatLon;
  source: "device" | "default";
  error?: string;
}> {
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
      error: err instanceof Error ? err.message : "Failed to read location.",
    };
  }
}
