import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, useColorScheme } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Court } from "@/src/services/courts";
import { Text } from "@/src/components/ui/Text";

type CourtsMapProps = {
  center: { lat: number; lon: number };
  courts: Court[];
  courtActivity?: Map<string, number>;
  recenterSignal?: number;
  onSelectCourt?: (courtId: string) => void;
};

export function CourtsMap({
  center,
  courts,
  courtActivity,
  recenterSignal,
  onSelectCourt,
}: CourtsMapProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: center.lat,
    longitude: center.lon,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const courtsWithCoords = useMemo(
    () =>
      courts.filter(
        (court) =>
          typeof court.latitude === "number" &&
          typeof court.longitude === "number" &&
          Number.isFinite(court.latitude) &&
          Number.isFinite(court.longitude) &&
          typeof court.id === "string" &&
          court.id.length > 0
      ),
    [courts]
  );

  useEffect(() => {
    console.log("[CourtsMap] courts", {
      total: courts.length,
      withCoords: courtsWithCoords.length,
    });
  }, [courts.length, courtsWithCoords.length]);

  // Recenter when center changes
  useEffect(() => {
    setRegion((prev) => ({
      ...prev,
      latitude: center.lat,
      longitude: center.lon,
    }));
  }, [center.lat, center.lon]);

  // Recenter on signal
  useEffect(() => {
    if (typeof recenterSignal === "number" && recenterSignal > 0) {
      mapRef.current?.animateToRegion(
        {
          latitude: center.lat,
          longitude: center.lon,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        },
        600
      );
    }
  }, [recenterSignal, center.lat, center.lon]);

  const handleMarkerPress = useCallback(
    (courtId: string) => {
      onSelectCourt?.(courtId);
    },
    [onSelectCourt]
  );

  // Map style based on theme
  const mapStyle = useMemo(() => {
    if (!isDark) {
      // Light mode - use default style
      return [];
    }
    // Dark mode - custom dark style
    return [
      {
        elementType: "geometry",
        stylers: [{ color: "#1d2026" }],
      },
        {
          elementType: "labels.text.fill",
          stylers: [{ color: "#8a8a8a" }],
        },
        {
          elementType: "labels.text.stroke",
          stylers: [{ color: "#1d2026" }],
        },
        {
          featureType: "administrative",
          elementType: "geometry",
          stylers: [{ color: "#4a4a4a" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6f6f6f" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#263c3f" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b9a76" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2835" }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#f3d19c" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#515c6d" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#17263c" }],
        },
      ];
  }, [isDark]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={PROVIDER_DEFAULT}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass
      customMapStyle={mapStyle}
    >
      {courtsWithCoords.map((court) => {
        const checkIns = courtActivity?.get(court.id) || 0;
        const isHot = checkIns > 0;

        return (
          <Marker
            key={court.id}
            coordinate={{
              latitude: court.latitude!,
              longitude: court.longitude!,
            }}
            onPress={() => handleMarkerPress(court.id)}
            title={court.name}
            description={
              isHot
                ? `🔥 ${checkIns} ${checkIns === 1 ? "player" : "players"} here now`
                : undefined
            }
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isHot ? (
                // Hot court marker - location pin with flame
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      position: "relative",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                      elevation: 6,
                    }}
                  >
                    <Ionicons name="location" size={44} color="#960000" />
                    <View
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 0,
                        right: 0,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>🔥</Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Regular court marker - simple location pin
                <View
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Ionicons name="location" size={36} color="#960000" />
                </View>
              )}
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}
