import React, { useRef } from "react";
import { ActivityIndicator, Pressable, TextInput, View, useColorScheme } from "react-native";
import { Region } from "react-native-maps";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { CourtsMap } from "@/src/components/Map/CourtsMap";
import { BottomSheetCourtPreview } from "@/src/components/Map/BottomSheetCourtPreview";
import { Court, listCourtsNearby } from "@/src/services/courts";
import {
  DEFAULT_CENTER,
  getForegroundLocationOrDefault,
  geocodeAddress,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
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
  const [searchText, setSearchText] = React.useState('');
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [mapRefreshing, setMapRefreshing] = React.useState(false);
  const regionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks programmatic region changes (recenter/search) to skip auto-fetch
  const skipRegionFetchRef = useRef(0);

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
    skipRegionFetchRef.current += 1;
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

  const handleMapRegionChangeComplete = React.useCallback((region: Region) => {
    if (skipRegionFetchRef.current > 0) {
      skipRegionFetchRef.current -= 1;
      return;
    }
    if (regionDebounceRef.current) {
      clearTimeout(regionDebounceRef.current);
    }
    regionDebounceRef.current = setTimeout(async () => {
      const coords = { lat: region.latitude, lon: region.longitude };
      setCenter(coords);
      setMapRefreshing(true);
      try {
        await fetchCourts(coords);
      } finally {
        setMapRefreshing(false);
      }
    }, 600);
  }, [fetchCourts]);

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

  const handleLocationSearch = React.useCallback(async () => {
    const query = searchText.trim();
    if (!query) return;
    setSearchLoading(true);
    setError(null);
    try {
      const coords = await geocodeAddress(query);
      if (!coords) {
        setError(`No location found for "${query}"`);
        return;
      }
      setCenter(coords);
      setLocationSource("default");
      skipRegionFetchRef.current += 1;
      setRecenterSignal((v) => v + 1);
      await fetchCourts(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Location search failed.");
    } finally {
      setSearchLoading(false);
    }
  }, [searchText, fetchCourts]);

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
          onRegionChangeComplete={handleMapRegionChangeComplete}
        />
      </MapErrorBoundary>

      {/* Location search bar */}
      <View
        className="absolute left-0 right-0 px-4"
        style={{ top: insets.top + 12 }}
      >
        <View
          className="flex-row items-center rounded-2xl px-3 py-2.5"
          style={{
            backgroundColor: isDark ? 'rgba(20,20,20,0.92)' : 'rgba(255,255,255,0.95)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Ionicons
            name="search"
            size={16}
            color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'}
          />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleLocationSearch}
            placeholder="Search a location..."
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 15,
              color: isDark ? '#fff' : '#111',
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchLoading ? (
            <ActivityIndicator size="small" color={isDark ? '#fff' : '#960000'} />
          ) : searchText.length > 0 ? (
            <Pressable onPress={() => setSearchText('')} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={16}
                color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {mapRefreshing && !loading ? (
        <View className="absolute left-0 right-0 items-center" style={{ top: insets.top + 60 }}>
          <View
            className="flex-row items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              backgroundColor: isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.9)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }}
          >
            <ActivityIndicator size="small" color={isDark ? '#fff' : '#960000'} />
            <Text className="text-xs text-gray-700 dark:text-white/70">Updating courts...</Text>
          </View>
        </View>
      ) : null}
      {error ? (
        <View className="absolute left-0 right-0 px-4" style={{ top: insets.top + 60 }}>
          <View className="rounded-2xl bg-red-900/90 px-4 py-3">
            <Text className="text-sm text-white">{error}</Text>
          </View>
        </View>
      ) : null}
      {!error && !loading && courts.length === 0 ? (
        <View className="absolute left-0 right-0 px-6" style={{ top: insets.top + 60 }}>
          <Text className="text-gray-600 dark:text-white/70">No courts found near you.</Text>
        </View>
      ) : null}
      {!error && !loading && courts.length > 0 && mappableCourts.length === 0 ? (
        <View className="absolute left-0 right-0 px-6" style={{ top: insets.top + 60 }}>
          <Text className="text-gray-600 dark:text-white/70">No mappable courts (missing coordinates).</Text>
        </View>
      ) : null}
      <View className="absolute right-0 bottom-0 px-6 pb-6">
        <View className="flex-row gap-2">
          <Button
            title={loading ? "Loading..." : "Refresh"}
            variant="secondary"
            onPress={async () => {
              setLoading(true);
              setError(null);
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
      <BottomSheetCourtPreview
        court={selectedCourt}
        checkInsCount={selectedCourt ? courtActivity.get(selectedCourt.id) || 0 : 0}
        onClose={handleClosePreview}
      />
    </View>
  );
}
