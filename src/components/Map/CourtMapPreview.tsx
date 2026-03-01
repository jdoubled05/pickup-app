import React, { useMemo } from "react";
import { Pressable, View, useColorScheme } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/src/components/ui/Text";

type CourtMapPreviewProps = {
  latitude: number;
  longitude: number;
  onPress: () => void;
};

const DELTA = 0.004; // ~400m view

export function CourtMapPreview({ latitude, longitude, onPress }: CourtMapPreviewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const region = useMemo(
    () => ({
      latitude,
      longitude,
      latitudeDelta: DELTA,
      longitudeDelta: DELTA,
    }),
    [latitude, longitude]
  );

  const mapStyle = useMemo(() => {
    if (!isDark) return [];
    return [
      { elementType: "geometry", stylers: [{ color: "#1d2026" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#1d2026" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#4a4a4a" }] },
      { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f6f6f" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    ];
  }, [isDark]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="View court on full map"
      accessibilityRole="button"
      style={{ height: 180, borderRadius: 16, overflow: "hidden" }}
    >
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        customMapStyle={mapStyle}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        pointerEvents="none"
      >
        <Marker coordinate={{ latitude, longitude }} tracksViewChanges={false}>
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
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 3,
              elevation: 4,
            }}
          >
            <Ionicons name="basketball" size={16} color="#fff" />
          </View>
        </Marker>
      </MapView>

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
