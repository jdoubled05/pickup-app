import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { CourtsMap } from "@/src/components/Map/CourtsMap";
import { Court, listCourtsNearby } from "@/src/services/courts";
import {
  DEFAULT_CENTER,
  getForegroundLocationOrDefault,
} from "@/src/services/location";

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
        <View className="flex-1 bg-black px-6 py-6">
          <Text className="text-2xl font-bold">Maps Test</Text>
          <Text className="mt-2 text-white/70">
            Map failed to load. Rebuild the dev client with `npx expo run:ios` and restart
            Metro using `npx expo start --dev-client -c`.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function MapsTest() {
  const router = useRouter();
  const [center, setCenter] = React.useState(DEFAULT_CENTER);
  const [locationSource, setLocationSource] = React.useState<"device" | "default">(
    "default"
  );
  const [courts, setCourts] = React.useState<Court[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [recenterSignal, setRecenterSignal] = React.useState(0);
  const [recenterLocked, setRecenterLocked] = React.useState(false);

  const fetchCourts = React.useCallback(async (coords: { lat: number; lon: number }) => {
    const data = await listCourtsNearby(coords.lat, coords.lon, 50000);
    setCourts(data);
  }, []);

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
    router.push({ pathname: "/courts/[id]", params: { id: courtId } });
  };

  const handleRecenter = async () => {
    if (recenterLocked) {
      return;
    }
    setRecenterLocked(true);
    await recenterToDevice();
    setTimeout(() => setRecenterLocked(false), 800);
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
    <View className="flex-1 bg-black">
      <MapErrorBoundary>
        <CourtsMap
          center={center}
          courts={mappableCourts}
          onSelectCourt={handleSelectCourt}
          recenterSignal={recenterSignal}
        />
      </MapErrorBoundary>
      <View className="absolute left-0 right-0 top-0 px-6 pt-6">
        <Text className="text-2xl font-bold">Maps Test</Text>
        {error ? (
          <Text className="mt-2 text-white/70">{error}</Text>
        ) : null}
      </View>
      <View className="absolute right-0 top-0 px-6 pt-6">
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
          />
          <Button
            title="Recenter"
            variant="secondary"
            onPress={handleRecenter}
          />
        </View>
        <Text className="mt-2 text-white/60">
          {locationSource === "device"
            ? "Centered on your location"
            : "Using default location"}
        </Text>
      </View>
      {!loading && courts.length === 0 ? (
        <View className="absolute left-0 right-0 top-20 px-6">
          <Text className="text-white/70">No courts found near you.</Text>
        </View>
      ) : null}
      {!loading && courts.length > 0 && mappableCourts.length === 0 ? (
        <View className="absolute left-0 right-0 top-20 px-6">
          <Text className="text-white/70">No mappable courts (missing coordinates).</Text>
        </View>
      ) : null}
    </View>
  );
}
