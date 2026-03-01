import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { checkOut } from "./checkins";

const CHECKIN_LOCATION_KEY = "checkin_court_location";

// Checkout if user is more than 500m from the court
const AUTO_CHECKOUT_DISTANCE_METERS = 500;

type CheckInLocation = {
  courtId: string;
  latitude: number;
  longitude: number;
};

/**
 * Stores court coordinates when a user checks in.
 * Called by the UI after a successful check-in.
 */
export async function storeCheckInLocation(
  courtId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CHECKIN_LOCATION_KEY,
      JSON.stringify({ courtId, latitude, longitude })
    );
  } catch {
    // Non-critical
  }
}

/**
 * Clears the stored court location on manual checkout.
 */
export async function clearCheckInLocation(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHECKIN_LOCATION_KEY);
  } catch {
    // Non-critical
  }
}

/**
 * Returns the stored check-in court location, or null if none.
 */
export async function getStoredCheckInLocation(): Promise<CheckInLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(CHECKIN_LOCATION_KEY);
    return raw ? (JSON.parse(raw) as CheckInLocation) : null;
  } catch {
    return null;
  }
}

/**
 * Haversine distance in metres between two coordinates.
 */
function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Checks whether the user has left the court and, if so, performs auto-checkout.
 *
 * Called on app foreground. Silently no-ops when:
 * - No active check-in is stored
 * - Location permission is not granted
 * - User is still within range
 *
 * Returns true if the user was auto-checked out.
 */
export async function runAutoCheckoutIfNeeded(): Promise<boolean> {
  const stored = await getStoredCheckInLocation();
  if (!stored) return false;

  // Check location permission without prompting
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") {
    // No location access — rely on DB expiry (3h)
    return false;
  }

  let position: Location.LocationObject;
  try {
    position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch {
    return false;
  }

  const distance = distanceMeters(
    position.coords.latitude,
    position.coords.longitude,
    stored.latitude,
    stored.longitude
  );

  if (distance > AUTO_CHECKOUT_DISTANCE_METERS) {
    await checkOut();
    await clearCheckInLocation();
    return true;
  }

  return false;
}
