import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View, useColorScheme } from "react-native";
import MapLibreRN from "@maplibre/maplibre-react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Supercluster from "supercluster";
import { Court } from "@/src/services/courts";
import { Text } from "@/src/components/ui/Text";

MapLibreRN.setAccessToken(null);

const TILE_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/liberty";
const TILE_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

// Mirrors the react-native-maps Region shape so map.tsx doesn't need to change
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type CourtsMapProps = {
  center: { lat: number; lon: number };
  courts: Court[];
  courtActivity?: Map<string, number>;
  recenterSignal?: number;
  onSelectCourt?: (courtId: string) => void;
  onRegionChangeComplete?: (region: Region) => void;
};

type CourtFeature = Supercluster.PointFeature<{ courtId: string; isHot: boolean }>;

// MapLibre visibleBounds: [[neLon, neLat], [swLon, swLat]]
function boundsToRegion(
  visibleBounds: [[number, number], [number, number]],
  center: [number, number]
): Region {
  const [[neLon, neLat], [swLon, swLat]] = visibleBounds;
  return {
    latitude: center[1],
    longitude: center[0],
    latitudeDelta: Math.abs(neLat - swLat),
    longitudeDelta: Math.abs(neLon - swLon),
  };
}

function CourtsMapComponent({
  center,
  courts,
  courtActivity,
  recenterSignal,
  onSelectCourt,
  onRegionChangeComplete,
}: CourtsMapProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const cameraRef = useRef<React.ElementRef<typeof MapLibreRN.Camera>>(null);
  const centerRef = useRef(center);
  useEffect(() => { centerRef.current = center; }, [center]);

  // Set initial camera position imperatively after mount — avoids Android bug
  // where defaultSettings re-applies on every re-render, snapping the map back.
  const cameraInitialized = useRef(false);
  useEffect(() => {
    if (!cameraInitialized.current && cameraRef.current) {
      cameraInitialized.current = true;
      cameraRef.current.setCamera({
        centerCoordinate: [centerRef.current.lon, centerRef.current.lat],
        zoomLevel: 12,
        animationDuration: 0,
      });
    }
  });

  // Track current zoom so clusters can be computed
  const [zoom, setZoom] = useState(12);
  const [visibleBounds, setVisibleBounds] = useState<[[number, number], [number, number]] | null>(null);

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

  const supercluster = useMemo(() => {
    const sc = new Supercluster<{ courtId: string; isHot: boolean }>({
      radius: 30,
      maxZoom: 16,
    });

    const features: CourtFeature[] = courtsWithCoords.map((court) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [court.longitude!, court.latitude!],
      },
      properties: {
        courtId: court.id,
        isHot: (courtActivity?.get(court.id) ?? 0) > 0,
      },
    }));

    sc.load(features);
    return sc;
  }, [courtsWithCoords, courtActivity]);

  const clusters = useMemo(() => {
    if (!visibleBounds) {
      // Use a wide bbox until the first region change fires
      return supercluster.getClusters([-180, -85, 180, 85], zoom);
    }
    const [[neLon, neLat], [swLon, swLat]] = visibleBounds;
    const bbox: [number, number, number, number] = [
      Math.min(swLon, neLon),
      Math.min(swLat, neLat),
      Math.max(swLon, neLon),
      Math.max(swLat, neLat),
    ];
    return supercluster.getClusters(bbox, zoom);
  }, [supercluster, visibleBounds, zoom]);

  // Animate to device location on recenter signal
  useEffect(() => {
    if (typeof recenterSignal === "number" && recenterSignal > 0) {
      cameraRef.current?.setCamera({
        centerCoordinate: [centerRef.current.lon, centerRef.current.lat],
        zoomLevel: 12,
        animationDuration: 600,
      });
    }
  }, [recenterSignal]);

  const handleMarkerPress = useCallback(
    (courtId: string) => {
      onSelectCourt?.(courtId);
    },
    [onSelectCourt]
  );

  const handleClusterPress = useCallback(
    (clusterId: number, coordinate: [number, number]) => {
      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(clusterId),
        17
      );
      cameraRef.current?.setCamera({
        centerCoordinate: coordinate,
        zoomLevel: expansionZoom,
        animationDuration: 400,
      });
    },
    [supercluster]
  );

  const handleRegionDidChange = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point>) => {
      const props = feature.properties as {
        zoomLevel: number;
        visibleBounds: [[number, number], [number, number]];
        isUserInteraction: boolean;
      } | null;
      if (!props) return;

      const { zoomLevel, visibleBounds: bounds, isUserInteraction } = props;
      setZoom(Math.round(zoomLevel));
      setVisibleBounds(bounds);

      // Only fetch courts when the user actually moved the map, not on programmatic
      // camera moves (recenter, search navigation) — those already fetch directly.
      if (onRegionChangeComplete && isUserInteraction) {
        const center = feature.geometry.coordinates as [number, number];
        onRegionChangeComplete(boundsToRegion(bounds, center));
      }
    },
    [onRegionChangeComplete]
  );

  return (
    <MapLibreRN.MapView
      style={{ flex: 1 }}
      mapStyle={isDark ? TILE_STYLE_DARK : TILE_STYLE_LIGHT}
      attributionEnabled={false}
      logoEnabled={false}
      compassEnabled
      onRegionDidChange={handleRegionDidChange}
    >
      <MapLibreRN.Camera ref={cameraRef} />

      <MapLibreRN.UserLocation visible renderMode="normal" />

      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const coordinate: [number, number] = [longitude, latitude];

        // Cluster marker
        if ("cluster" in cluster.properties && cluster.properties.cluster) {
          const { cluster_id, point_count } =
            cluster.properties as Supercluster.ClusterProperties;

          const leaves = supercluster.getLeaves(cluster_id, Infinity);
          const hasHot = leaves.some(
            (leaf) => (leaf.properties as { isHot: boolean }).isHot
          );

          return (
            <MapLibreRN.MarkerView
              key={`cluster-${cluster_id}`}
              coordinate={coordinate}
              allowOverlap
            >
              <Pressable
                onPress={() => handleClusterPress(cluster_id, coordinate)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: hasHot ? "#960000" : isDark ? "#222" : "#fff",
                  borderWidth: 2.5,
                  borderColor: "#960000",
                  alignItems: "center",
                  justifyContent: "center",
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              >
                {hasHot && (
                  <Text style={{ fontSize: 9, lineHeight: 10 }}>🔥</Text>
                )}
                <Text
                  style={{
                    fontSize: hasHot ? 11 : 13,
                    fontWeight: "700",
                    color: hasHot ? "#fff" : "#960000",
                    lineHeight: hasHot ? 12 : 14,
                  }}
                >
                  {point_count}
                </Text>
              </Pressable>
            </MapLibreRN.MarkerView>
          );
        }

        // Individual court marker
        const { courtId, isHot } = cluster.properties as {
          courtId: string;
          isHot: boolean;
        };
        const court = courtsWithCoords.find((c) => c.id === courtId);
        if (!court) return null;

        return (
          <MapLibreRN.MarkerView
            key={courtId}
            coordinate={coordinate}
            allowOverlap
          >
            <Pressable onPress={() => handleMarkerPress(courtId)}>
              {isHot ? (
                <View style={{ alignItems: "center", justifyContent: "center" }}>
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
              ) : (
                <Ionicons name="location" size={36} color="#960000" />
              )}
            </Pressable>
          </MapLibreRN.MarkerView>
        );
      })}
    </MapLibreRN.MapView>
  );
}

export const CourtsMap = React.memo(CourtsMapComponent);
