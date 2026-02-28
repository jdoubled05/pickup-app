import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View, useColorScheme } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";
import Ionicons from "@expo/vector-icons/Ionicons";
import Supercluster from "supercluster";
import { Court } from "@/src/services/courts";
import { Text } from "@/src/components/ui/Text";

type CourtsMapProps = {
  center: { lat: number; lon: number };
  courts: Court[];
  courtActivity?: Map<string, number>;
  recenterSignal?: number;
  onSelectCourt?: (courtId: string) => void;
  onRegionChangeComplete?: (region: Region) => void;
};

type CourtFeature = Supercluster.PointFeature<{ courtId: string; isHot: boolean }>;

function regionToZoom(region: Region): number {
  return Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
}

function regionToBBox(region: Region): [number, number, number, number] {
  const w = region.longitude - region.longitudeDelta / 2;
  const s = region.latitude - region.latitudeDelta / 2;
  const e = region.longitude + region.longitudeDelta / 2;
  const n = region.latitude + region.latitudeDelta / 2;
  return [w, s, e, n];
}

export function CourtsMap({
  center,
  courts,
  courtActivity,
  recenterSignal,
  onSelectCourt,
  onRegionChangeComplete,
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

  // Build supercluster index whenever courts or activity changes
  const supercluster = useMemo(() => {
    const sc = new Supercluster<{ courtId: string; isHot: boolean }>({
      radius: 50,
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

  // Compute visible clusters for the current region
  const clusters = useMemo(() => {
    const zoom = regionToZoom(region);
    const bbox = regionToBBox(region);
    return supercluster.getClusters(bbox, zoom);
  }, [supercluster, region]);

  // Recenter when center prop changes
  useEffect(() => {
    setRegion((prev) => ({
      ...prev,
      latitude: center.lat,
      longitude: center.lon,
    }));
  }, [center.lat, center.lon]);

  // Animate to device location on recenter signal
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

  // Zoom into a cluster when tapped
  const handleClusterPress = useCallback(
    (clusterId: number, coordinate: { latitude: number; longitude: number }) => {
      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(clusterId),
        17
      );
      const longitudeDelta = 360 / Math.pow(2, expansionZoom);
      const latitudeDelta = longitudeDelta;
      mapRef.current?.animateToRegion(
        {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          latitudeDelta,
          longitudeDelta,
        },
        400
      );
    },
    [supercluster]
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
      { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
      { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
      { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
      { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
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
      onRegionChangeComplete={(r) => {
        setRegion(r);
        onRegionChangeComplete?.(r);
      }}
    >
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const coordinate = { latitude, longitude };

        // Cluster marker
        if ('cluster' in cluster.properties && cluster.properties.cluster) {
          const { cluster_id, point_count } = cluster.properties as Supercluster.ClusterProperties;

          // Check if any court in this cluster is hot
          const leaves = supercluster.getLeaves(cluster_id, Infinity);
          const hasHot = leaves.some((leaf) => (leaf.properties as { isHot: boolean }).isHot);

          return (
            <Marker
              key={`cluster-${cluster_id}`}
              coordinate={coordinate}
              onPress={() => handleClusterPress(cluster_id, coordinate)}
              tracksViewChanges={false}
            >
              <Pressable
                onPress={() => handleClusterPress(cluster_id, coordinate)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: hasHot ? "#960000" : (isDark ? "#222" : "#fff"),
                  borderWidth: 2.5,
                  borderColor: "#960000",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
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
            </Marker>
          );
        }

        // Individual court marker
        const { courtId, isHot } = cluster.properties as { courtId: string; isHot: boolean };
        const court = courtsWithCoords.find((c) => c.id === courtId);
        if (!court) return null;

        return (
          <Marker
            key={courtId}
            coordinate={coordinate}
            onPress={() => handleMarkerPress(courtId)}
            title={court.name}
            tracksViewChanges={false}
          >
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {isHot ? (
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                  <View
                    style={{
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
