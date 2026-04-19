import React, { useMemo } from "react";
import { Pressable, View, useColorScheme } from "react-native";
import MapLibreRN from "@maplibre/maplibre-react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/src/components/ui/Text";

MapLibreRN.setAccessToken(null);

const TILE_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/liberty";
const TILE_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

type CourtMapPreviewProps = {
  latitude: number;
  longitude: number;
  onPress: () => void;
};

export function CourtMapPreview({ latitude, longitude, onPress }: CourtMapPreviewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const coordinate = useMemo<[number, number]>(
    () => [longitude, latitude],
    [longitude, latitude]
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="View court on full map"
      accessibilityRole="button"
      style={{ height: 180, borderRadius: 16, overflow: "hidden", backgroundColor: "#000" }}
      renderToHardwareTextureAndroid
    >
      <MapLibreRN.MapView
        style={{ flex: 1 }}
        mapStyle={isDark ? TILE_STYLE_DARK : TILE_STYLE_LIGHT}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        compassEnabled={false}
      >
        <MapLibreRN.Camera
          centerCoordinate={coordinate}
          zoomLevel={14}
          animationDuration={0}
        />
        <MapLibreRN.MarkerView coordinate={coordinate} allowOverlap>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#960000",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2.5,
              borderColor: "#fff",
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
            }}
          >
            <Ionicons name="basketball" size={16} color="#fff" />
          </View>
        </MapLibreRN.MarkerView>
      </MapLibreRN.MapView>

      {/* "View on Map" badge */}
      <View
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.9)",
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
      >
        <Ionicons name="expand-outline" size={13} color={isDark ? "#fff" : "#111"} />
        <Text style={{ fontSize: 12, fontWeight: "600", color: isDark ? "#fff" : "#111" }}>
          View on Map
        </Text>
      </View>
    </Pressable>
  );
}
