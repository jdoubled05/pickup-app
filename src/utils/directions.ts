import { Linking, Platform, Alert } from "react-native";

/**
 * Opens the native Maps app with directions to the specified coordinates
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @param name - Name of the destination (for labeling)
 */
export async function openDirections(
  latitude: number,
  longitude: number,
  name: string
): Promise<void> {
  // Validate coordinates
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    Alert.alert(
      "Location Unavailable",
      "This court's coordinates are not available. Cannot provide directions."
    );
    return;
  }

  // Construct platform-specific URL
  const scheme = Platform.select({
    ios: "maps://maps.apple.com/",
    android: "geo:",
  });

  const url = Platform.select({
    ios: `${scheme}?q=${encodeURIComponent(name)}&ll=${latitude},${longitude}`,
    android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(
      name
    )})`,
  });

  if (!url) {
    Alert.alert("Error", "Unable to open maps on this device.");
    return;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to Google Maps web URL
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    Alert.alert(
      "Error",
      "Unable to open directions. Please ensure you have a maps app installed."
    );
    console.error("Failed to open directions:", error);
  }
}
