import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { CourtsMap } from "@/src/components/Map/CourtsMap";
import { BottomSheetCourtPreview } from "@/src/components/Map/BottomSheetCourtPreview";
import { Court, listCourtsNearby } from "@/src/services/courts";
import {
  DEFAULT_CENTER,
  getForegroundLocationOrDefault,
} from "@/src/services/location";
import { getSupabaseEnvStatus } from "@/src/services/supabase";
import { getCourtActivityBatch } from "@/src/services/courtActivity";

type MapErrorBoundaryProps = {
  children: React.ReactNode;
};

type MapErrorBoundaryState = {
  hasError: boolean;
};

class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-white dark:bg-black px-6 py-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Map View</Text>
          <Text className="mt-2 text-gray-600 dark:text-white/70">
            Map failed to load. Please try again later.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function MapsTest() {
  const router = useRouter();
  const supabaseStatus = getSupabaseEnvStatus();
  const [center, setCenter] = React.useState(DEFAULT_CENTER);
  const [locationSource, setLocationSource] = React.useState<"device" | "default">(
    "default"
  );
  const [courts, setCourts] = React.useState<Court[]>([]);
  const [courtActivity, setCourtActivity] = React.useState<Map<string, number>>(new Map());
  const [selectedCourt, setSelectedCourt] = React.useState<Court | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [recenterLoading, setRecenterLoading] = React.useState(false);
  const [recenterSignal, setRecenterSignal] = React.useState(0);
  const [recenterLocked, setRecenterLocked] = React.useState(false);

  const fetchCourts = React.useCallback(async (coords: { lat: number; lon: number }) => {
    const data = await listCourtsNearby(coords.lat, coords.lon, 50000);
    setCourts(data);

    // Fetch activity data for all courts
    if (supabaseStatus.configured && data.length > 0) {
      const courtIds = data.map((c) => c.id);
      const activity = await getCourtActivityBatch(courtIds);
      setCourtActivity(activity);
    }
  }, [supabaseStatus.configured]);

  const recenterToDevice = React.useCallback(async () => {
    const result = await getForegroundLocationOrDefault();
    setCenter(result.coords);
    setLocationSource(result.source);
    await fetchCourts(result.coords);
    setRecenterSignal((value) => value + 1);
  }, [fetchCourts]);

  const loadCourts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const location = await getForegroundLocationOrDefault();
    setCenter(location.coords);
    setLocationSource(location.source);
    try {
      await fetchCourts(location.coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courts.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      await loadCourts();
    };

    if (isMounted) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [loadCourts]);

  const handleSelectCourt = (courtId: string) => {
    const court = courts.find((c) => c.id === courtId);
    if (court) {
      setSelectedCourt(court);
    }
  };

  const handleClosePreview = () => {
    setSelectedCourt(null);
  };

  const handleRecenter = async () => {
    if (recenterLocked || recenterLoading) {
      return;
    }
    setRecenterLocked(true);
    setRecenterLoading(true);
    try {
      await recenterToDevice();
    } finally {
      setRecenterLoading(false);
      setTimeout(() => setRecenterLocked(false), 800);
    }
  };

  const mappableCourts = React.useMemo(
    () =>
      courts.filter(
        (court) =>
          typeof court.latitude === "number" &&
          typeof court.longitude === "number" &&
          Number.isFinite(court.latitude) &&
          Number.isFinite(court.longitude)
      ),
    [courts]
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <MapErrorBoundary>
        <CourtsMap
          center={center}
          courts={mappableCourts}
          courtActivity={courtActivity}
          onSelectCourt={handleSelectCourt}
          recenterSignal={recenterSignal}
        />
      </MapErrorBoundary>
      {error ? (
        <View className="absolute left-0 right-0 top-0 px-6 pt-6">
          <View className="rounded-2xl bg-red-900/90 px-4 py-3">
            <Text className="text-sm text-white">{error}</Text>
          </View>
        </View>
      ) : null}
      <View className="absolute right-0 bottom-0 px-6 pb-6">
        <View className="flex-row gap-2">
          <Button
            title={loading ? "Loading..." : "Refresh"}
            variant="secondary"
            onPress={async () => {
              setLoading(true);
              try {
                await fetchCourts(center);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load courts.");
              } finally {
                setLoading(false);
              }
            }}
            accessibilityLabel="Refresh courts on map"
          />
          <Button
            title={recenterLoading ? "Recentering..." : "Recenter"}
            variant="secondary"
            onPress={handleRecenter}
            disabled={recenterLoading}
            accessibilityLabel="Recenter map to your location"
          />
        </View>
        <Text className="mt-2 text-gray-500 dark:text-white/60">
          {locationSource === "device"
            ? "Centered on your location"
            : "Using default location"}
        </Text>
      </View>
      {!loading && courts.length === 0 ? (
        <View className="absolute left-0 right-0 top-20 px-6">
          <Text className="text-gray-600 dark:text-white/70">No courts found near you.</Text>
        </View>
      ) : null}
      {!loading && courts.length > 0 && mappableCourts.length === 0 ? (
        <View className="absolute left-0 right-0 top-20 px-6">
          <Text className="text-gray-600 dark:text-white/70">No mappable courts (missing coordinates).</Text>
        </View>
      ) : null}
      <BottomSheetCourtPreview
        court={selectedCourt}
        checkInsCount={selectedCourt ? courtActivity.get(selectedCourt.id) || 0 : 0}
        onClose={handleClosePreview}
      />
    </View>
  );
}
