import React, { useRef } from "react";
import { ActivityIndicator, Pressable, TextInput, View, useColorScheme } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { CourtsMap, Region } from "@/src/components/Map/CourtsMap";
import { BottomSheetCourtPreview } from "@/src/components/Map/BottomSheetCourtPreview";
import { Court, listCourtsNearby, searchCourts } from "@/src/services/courts";
import {
  DEFAULT_CENTER,
  getForegroundLocationOrDefault,
  geocodeAddress,
  autocompleteCities,
  CitySuggestion,
  STATE_ABBREVS,
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
  // True once we have the real initial center (device location or focus coords).
  // Gates map render so it opens at the right place instead of jumping from Atlanta.
  const [initialCenterReady, setInitialCenterReady] = React.useState(() => {
    const parsedLat = lat ? parseFloat(lat) : NaN;
    const parsedLon = lon ? parseFloat(lon) : NaN;
    return Number.isFinite(parsedLat) && Number.isFinite(parsedLon);
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
  const [citySuggestions, setCitySuggestions] = React.useState<CitySuggestion[]>([]);
  const [mapRefreshing, setMapRefreshing] = React.useState(false);
  const [filters, setFilters] = React.useState<CourtFilters>(DEFAULT_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const regionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks programmatic region changes (recenter/search) to skip auto-fetch
  const skipRegionFetchRef = useRef(0);
  // Tracks current viewport center for manual refresh without causing re-renders
  const viewportCenterRef = useRef(center);
  // Generation counter — increments on each fetch; stale responses are discarded
  const fetchGenerationRef = useRef(0);
  // User's real GPS location — used to compute distances regardless of map center
  const userCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  const fetchCourts = React.useCallback(async (coords: { lat: number; lon: number }, radiusMeters = 50000) => {
    const generation = ++fetchGenerationRef.current;
    const data = await listCourtsNearby(coords.lat, coords.lon, radiusMeters);
    if (generation !== fetchGenerationRef.current) return;

    // Re-compute distance_meters from user's actual GPS location so distances
    // are always relative to the user, not the map center / search location.
    const userCoords = userCoordsRef.current;
    const courts = userCoords
      ? data.map(court => {
          const dLat = (court.latitude - userCoords.lat) * (Math.PI / 180);
          const dLon = (court.longitude - userCoords.lon) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(userCoords.lat * (Math.PI / 180)) *
              Math.cos(court.latitude * (Math.PI / 180)) *
              Math.sin(dLon / 2) ** 2;
          return { ...court, distance_meters: 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) };
        })
      : data;
    setCourts(courts);

    // Fetch activity data for all courts
    if (supabaseStatus.configured && data.length > 0) {
      const courtIds = data.map((c) => c.id);
      const activity = await getCourtActivityBatch(courtIds);
      setCourtActivity(activity);
    }
  }, [supabaseStatus.configured]);

  const recenterToDevice = React.useCallback(async () => {
    const result = await getForegroundLocationOrDefault();
    userCoordsRef.current = result.coords;
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
    // Always get user location for distance calculations
    const userLocation = await getForegroundLocationOrDefault();
    userCoordsRef.current = userLocation.coords;
    setLocationSource(userLocation.source);
    if (!hasFocusCoords) {
      setCenter(userLocation.coords);
    }
    setInitialCenterReady(true);
    skipRegionFetchRef.current += 1;
    setRecenterSignal((v) => v + 1);
    try {
      // Always fetch using user's location so distance_meters is relative to the user
      await fetchCourts(userLocation.coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courts.");
    } finally {
      setLoading(false);
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

  // Auto-select the focused court once courts have loaded (only fires once per focusCourtId)
  const autoSelectedCourtRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (focusCourtId && courts.length > 0 && autoSelectedCourtRef.current !== focusCourtId) {
      const match = courts.find((c) => c.id === focusCourtId);
      if (match) {
        autoSelectedCourtRef.current = focusCourtId;
        setSelectedCourt(match);
      }
    }
  }, [focusCourtId, courts]);

  // Subscribe to real-time activity updates so the map reflects check-ins live
  React.useEffect(() => {
    if (!supabaseStatus.configured || courts.length === 0) return;
    const courtIds = courts.map((c) => c.id);
    const unsubscribe = subscribeToActivityUpdates(courtIds, setCourtActivity);
    return unsubscribe;
  }, [courts, supabaseStatus.configured]);

  const handleSelectCourt = React.useCallback((courtId: string) => {
    const court = courts.find((c) => c.id === courtId);
    if (court) {
      setSelectedCourt(court);
    }
  }, [courts]);

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
      // Compute radius as the half-diagonal of the visible viewport.
      // Minimum 50 km so zooming in never shrinks the fetched area and courts don't vanish.
      const latM = (region.latitudeDelta / 2) * 111000;
      const lonM = (region.longitudeDelta / 2) * 111000 * Math.cos(region.latitude * (Math.PI / 180));
      const radiusMeters = Math.min(Math.max(Math.sqrt(latM * latM + lonM * lonM), 50000), 200000);
      setMapRefreshing(true);
      try {
        await fetchCourts(coords, radiusMeters);
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

  // Debounced city autocomplete via Nominatim (supplements DB results)
  React.useEffect(() => {
    const q = searchText.trim();
    if (!searchFocused || q.length < 1) {
      setCitySuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await autocompleteCities(q, center);
      setCitySuggestions(results);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, searchFocused]);

  // Debounced global court search for name/address suggestions
  React.useEffect(() => {
    const q = searchText.trim();
    if (!searchFocused || q.length < 1) {
      setSuggestionResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchCourts(q);
      setSuggestionResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, searchFocused]);

  // Instant city matches from courts already in memory (prioritized — have courts data)
  const dbCitySuggestions = React.useMemo((): CitySuggestion[] => {
    const q = searchText.trim().toLowerCase();
    if (!searchFocused || q.length < 1) return [];
    const source = suggestionResults && suggestionResults.length > 0
      ? [...suggestionResults, ...courts]
      : courts;
    const seen = new Set<string>();
    const results: Array<CitySuggestion & { distSq: number }> = [];
    for (const c of source) {
      if (!c.city || typeof c.latitude !== 'number' || typeof c.longitude !== 'number') continue;
      if (!c.city.toLowerCase().includes(q)) continue;
      const key = c.city.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const stateRaw = c.state ?? '';
      const stateAbbrev = STATE_ABBREVS[stateRaw.toLowerCase()] ?? stateRaw;
      const displayName = stateAbbrev ? `${c.city}, ${stateAbbrev}` : c.city;
      const dlat = c.latitude - center.lat;
      const dlon = c.longitude - center.lon;
      results.push({ displayName, description: displayName, coords: { lat: c.latitude, lon: c.longitude }, distSq: dlat * dlat + dlon * dlon });
    }
    return results.sort((a, b) => a.distSq - b.distSq).slice(0, 3).map(({ distSq: _d, ...rest }) => rest);
  }, [searchText, searchFocused, courts, suggestionResults, center]);

  // Combined: DB cities first (instant), Nominatim fills slots for cities not in DB
  // Dedup by base city name so "Duluth, MN" is excluded if DB has "Duluth, GA"
  const combinedCitySuggestions = React.useMemo((): CitySuggestion[] => {
    if (!searchFocused) return [];
    const dbBaseNames = new Set(dbCitySuggestions.map((c) => c.displayName.split(',')[0].trim().toLowerCase()));
    const extra = citySuggestions.filter((c) => !dbBaseNames.has(c.displayName.split(',')[0].trim().toLowerCase()));
    return [...dbCitySuggestions, ...extra].slice(0, 3);
  }, [searchFocused, dbCitySuggestions, citySuggestions]);

  // Court name/address matches from DB
  const mapCourtSuggestions = React.useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!searchFocused || q.length < 1) return [];
    const source = suggestionResults && suggestionResults.length > 0 ? suggestionResults : courts;
    return source
      .filter((c) => c.name.toLowerCase().includes(q) || (c.address ?? '').toLowerCase().includes(q))
      .slice(0, 4);
  }, [searchText, searchFocused, courts, suggestionResults]);

  const mappableCourts = React.useMemo(() => {
    // On the map, skip the distance filter — the viewport already constrains the
    // visible area, so applying a "within X miles of user" filter would hide all
    // courts when the map is panned to a different city.
    const mapFilters = { ...filters, maxDistanceMiles: Infinity };
    const filtered = applyFilters(courts, mapFilters);
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
      {initialCenterReady ? (
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
      ) : (
        <View className="flex-1 items-center justify-center bg-white dark:bg-black">
          <ActivityIndicator size="large" color="#960000" />
        </View>
      )}

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
              onFocus={() => {
                if (blurTimerRef.current) {
                  clearTimeout(blurTimerRef.current);
                  blurTimerRef.current = null;
                }
                setSearchFocused(true);
              }}
              onBlur={() => {
                blurTimerRef.current = setTimeout(() => {
                  blurTimerRef.current = null;
                  setSearchFocused(false);
                }, 150);
              }}
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
            testID="filter-button"
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
        {searchFocused && (combinedCitySuggestions.length > 0 || mapCourtSuggestions.length > 0) && (
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
            {combinedCitySuggestions.map((city, i) => {
              const isLast = i === combinedCitySuggestions.length - 1 && mapCourtSuggestions.length === 0;
              return (
                <Pressable
                  key={`city-${city.displayName}`}
                  onPress={() => {
                    setSearchText(city.displayName);
                    setSearchFocused(false);
                    setSuggestionResults(null);
                    setCitySuggestions([]);
                    searchInputRef.current?.blur();
                    setCenter(city.coords);
                    skipRegionFetchRef.current += 1;
                    setRecenterSignal((v) => v + 1);
                    fetchCourts(city.coords);
                  }}
                  accessibilityLabel={city.displayName}
                  accessibilityRole="button"
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
                      {city.displayName}
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
                  setSearchText(court.name);
                  setSearchFocused(false);
                  setSuggestionResults(null);
                  setCitySuggestions([]);
                  searchInputRef.current?.blur();
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
            testID="refresh-button"
          />
          <Button
            title={recenterLoading ? "Recentering..." : "Recenter"}
            variant="secondary"
            onPress={handleRecenter}
            disabled={recenterLoading}
            accessibilityLabel="Recenter map to your location"
            testID="recenter-button"
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
