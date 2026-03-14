import React, { useRef } from "react";
import { ActivityIndicator, Pressable, TextInput, View, useColorScheme } from "react-native";
import { Region } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { CourtsMap } from "@/src/components/Map/CourtsMap";
import { BottomSheetCourtPreview } from "@/src/components/Map/BottomSheetCourtPreview";
import { Court, listCourtsNearby, searchCourts } from "@/src/services/courts";
import {
  DEFAULT_CENTER,
  getForegroundLocationOrDefault,
  geocodeAddress,
} from "@/src/services/location";
import { getSupabaseEnvStatus } from "@/src/services/supabase";
import { getCourtActivityBatch, subscribeToActivityUpdates } from "@/src/services/courtActivity";
import { FilterModal } from "@/src/components/FilterModal";
import {
  CourtFilters,
  DEFAULT_FILTERS,
  applyFilters,
  hasActiveFilters,
  loadFilters,
  saveFilters,
} from "@/src/services/courtFilters";

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
  const { lat, lon, courtId: focusCourtId } = useLocalSearchParams<{ lat?: string; lon?: string; courtId?: string }>();
  const supabaseStatus = getSupabaseEnvStatus();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [center, setCenter] = React.useState(() => {
    const parsedLat = lat ? parseFloat(lat) : NaN;
    const parsedLon = lon ? parseFloat(lon) : NaN;
    return Number.isFinite(parsedLat) && Number.isFinite(parsedLon)
      ? { lat: parsedLat, lon: parsedLon }
      : DEFAULT_CENTER;
  });
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
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [suggestionResults, setSuggestionResults] = React.useState<Court[] | null>(null);
  const [mapRefreshing, setMapRefreshing] = React.useState(false);
  const [filters, setFilters] = React.useState<CourtFilters>(DEFAULT_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const regionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks programmatic region changes (recenter/search) to skip auto-fetch
  const skipRegionFetchRef = useRef(0);
  // Tracks current viewport center for manual refresh without causing re-renders
  const viewportCenterRef = useRef(center);

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
    const parsedLat = lat ? parseFloat(lat) : NaN;
    const parsedLon = lon ? parseFloat(lon) : NaN;
    const hasFocusCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLon);
    const coords = hasFocusCoords
      ? { lat: parsedLat, lon: parsedLon }
      : (await getForegroundLocationOrDefault()).coords;
    if (!hasFocusCoords) {
      const location = await getForegroundLocationOrDefault();
      setCenter(location.coords);
      setLocationSource(location.source);
    }
    try {
      await fetchCourts(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courts.");
    } finally {
      setLoading(false);
      if (hasFocusCoords) {
        skipRegionFetchRef.current += 1;
        setRecenterSignal((v) => v + 1);
      }
    }
  }, [lat, lon]);

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

  // Load saved filters on mount
  React.useEffect(() => {
    loadFilters().then(setFilters);
  }, []);

  // Auto-select the focused court once courts have loaded
  React.useEffect(() => {
    if (focusCourtId && courts.length > 0 && !selectedCourt) {
      const match = courts.find((c) => c.id === focusCourtId);
      if (match) setSelectedCourt(match);
    }
  }, [focusCourtId, courts, selectedCourt]);

  // Subscribe to real-time activity updates so the map reflects check-ins live
  React.useEffect(() => {
    if (!supabaseStatus.configured || courts.length === 0) return;
    const courtIds = courts.map((c) => c.id);
    const unsubscribe = subscribeToActivityUpdates(courtIds, setCourtActivity);
    return unsubscribe;
  }, [courts, supabaseStatus.configured]);

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
      viewportCenterRef.current = coords;
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

  // Debounced global court search for suggestions (no distance filter)
  React.useEffect(() => {
    const q = searchText.trim();
    if (!searchFocused || q.length < 1) {
      setSuggestionResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchCourts(q);
      setSuggestionResults(results);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText, searchFocused]);

  // Suggestions — use global search results (no distance limit) when available, else viewport courts
  const { mapCitySuggestions, mapCourtSuggestions } = React.useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!searchFocused || q.length < 1) return { mapCitySuggestions: [], mapCourtSuggestions: [] };

    const source = suggestionResults && suggestionResults.length > 0 ? suggestionResults : courts;

    const cityMap = new Map<string, { city: string; state: string | null; lat: number; lon: number }>();
    for (const c of source) {
      if (!c.city || typeof c.latitude !== 'number' || typeof c.longitude !== 'number') continue;
      const key = `${c.city}|${c.state ?? ''}`;
      if (!cityMap.has(key) && (c.city.toLowerCase().includes(q) || (c.state ?? '').toLowerCase().includes(q))) {
        cityMap.set(key, { city: c.city, state: c.state ?? null, lat: c.latitude, lon: c.longitude });
      }
    }

    const courtMatches = source
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.address ?? '').toLowerCase().includes(q)
      )
      .slice(0, 4);

    return {
      mapCitySuggestions: [...cityMap.values()].slice(0, 2),
      mapCourtSuggestions: courtMatches,
    };
  }, [searchText, searchFocused, courts, suggestionResults]);

  const mappableCourts = React.useMemo(() => {
    const filtered = applyFilters(courts, filters);
    return filtered.filter(
      (court) =>
        typeof court.latitude === "number" &&
        typeof court.longitude === "number" &&
        Number.isFinite(court.latitude) &&
        Number.isFinite(court.longitude)
    );
  }, [courts, filters]);

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

      {/* Tap-outside overlay — dismisses keyboard when search is focused */}
      {searchFocused && (
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={() => {
            searchInputRef.current?.blur();
            setSearchFocused(false);
          }}
        />
      )}

      {/* Location search bar */}
      <View
        className="absolute left-0 right-0 px-4"
        style={{ top: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-2">
          <View
            className="flex-1 flex-row items-center rounded-2xl px-3 py-2.5"
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
              ref={searchInputRef}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onSubmitEditing={handleLocationSearch}
              placeholder="Search courts or a location..."
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

          {/* Filter button */}
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            accessibilityLabel={hasActiveFilters(filters) ? 'Open filters, filters active' : 'Open filters'}
            accessibilityRole="button"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: hasActiveFilters(filters)
                ? '#960000'
                : (isDark ? 'rgba(20,20,20,0.92)' : 'rgba(255,255,255,0.95)'),
              borderWidth: 1,
              borderColor: hasActiveFilters(filters)
                ? '#960000'
                : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={hasActiveFilters(filters) ? '#fff' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)')}
            />
          </Pressable>
        </View>

        {/* Suggestions dropdown — cities then courts */}
        {(mapCitySuggestions.length > 0 || mapCourtSuggestions.length > 0) && (
          <View
            style={{
              marginTop: 6,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: isDark ? 'rgba(20,20,20,0.97)' : 'rgba(255,255,255,0.98)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {mapCitySuggestions.map((city, i) => {
              const isLast = i === mapCitySuggestions.length - 1 && mapCourtSuggestions.length === 0;
              return (
                <Pressable
                  key={`city-${city.city}-${city.state}`}
                  onPress={() => {
                    searchInputRef.current?.blur();
                    setSearchFocused(false);
                    setSearchText(city.state ? `${city.city}, ${city.state}` : city.city);
                    const coords = { lat: city.lat, lon: city.lon };
                    setCenter(coords);
                    skipRegionFetchRef.current += 1;
                    setRecenterSignal((v) => v + 1);
                    fetchCourts(coords);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <Ionicons name="business-outline" size={16} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#fff' : '#111' }} numberOfLines={1}>
                      {city.city}{city.state ? `, ${city.state}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
                </Pressable>
              );
            })}
            {mapCourtSuggestions.map((court, i) => (
              <Pressable
                key={court.id}
                onPress={() => {
                  searchInputRef.current?.blur();
                  setSearchFocused(false);
                  setSearchText(court.name);
                  if (typeof court.latitude === 'number' && typeof court.longitude === 'number') {
                    const coords = { lat: court.latitude, lon: court.longitude };
                    setCenter(coords);
                    skipRegionFetchRef.current += 1;
                    setRecenterSignal((v) => v + 1);
                    setSelectedCourt(court);
                    fetchCourts(coords);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: i < mapCourtSuggestions.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                }}
              >
                <Ionicons name="basketball-outline" size={16} color="#960000" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#fff' : '#111' }} numberOfLines={1}>
                    {court.name}
                  </Text>
                  {(court.city || court.state) && (
                    <Text style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }} numberOfLines={1}>
                      {[court.city, court.state].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={14} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
              </Pressable>
            ))}
          </View>
        )}
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
                await fetchCourts(viewportCenterRef.current);
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
      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          saveFilters(newFilters);
        }}
      />
    </View>
  );
}
