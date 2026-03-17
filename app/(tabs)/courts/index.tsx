import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Keyboard, Pressable, TextInput, View, ScrollView, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { SwipeableCourtCard, closeCurrentSwipeable } from "@/src/components/SwipeableCourtCard";
import { BasketballRefreshControl } from "@/src/components/BasketballRefreshControl";
import { FilterModal } from "@/src/components/FilterModal";
import { Court, listCourtsNearby, searchCourts } from "@/src/services/courts";
import { getForegroundLocationOrDefault } from "@/src/services/location";
import { getSupabaseEnvStatus } from "@/src/services/supabase";
import { hydrateSavedCourts, subscribeSavedCourts } from "@/src/services/savedCourts";
import { getCourtActivityBatch, subscribeToActivityUpdates } from "@/src/services/courtActivity";
import { getWeatherForLocation } from "@/src/services/weather";
import { WeatherData } from "@/src/types/weather";
import {
  CourtFilters,
  DEFAULT_FILTERS,
  applyFilters,
  loadFilters,
  saveFilters,
  hasActiveFilters,
} from "@/src/services/courtFilters";
import { subscribeToNearbyCheckIns } from "@/src/services/nearbyActivity";
import { getAnonymousUserId } from "@/src/services/checkins";

type FilterType = 'hot' | 'all' | 'saved';

export default function CourtsIndex() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtActivity, setCourtActivity] = useState<Map<string, number>>(new Map());
  const [courtWeather, setCourtWeather] = useState<Map<string, WeatherData | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filters, setFilters] = useState<CourtFilters>(DEFAULT_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Court[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const supabaseStatus = getSupabaseEnvStatus();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Sort courts by distance
  const sortedCourts = useMemo(() => {
    return courts
      .map((court, index) => ({ court, index }))
      .sort((a, b) => {
        const aDistance = a.court.distance_meters;
        const bDistance = b.court.distance_meters;
        const aHasDistance = typeof aDistance === "number";
        const bHasDistance = typeof bDistance === "number";

        if (aHasDistance && bHasDistance) {
          if (aDistance !== bDistance) {
            return aDistance - bDistance;
          }
          return a.index - b.index;
        }

        if (aHasDistance && !bHasDistance) return -1;
        if (!aHasDistance && bHasDistance) return 1;
        return a.index - b.index;
      })
      .map((entry) => entry.court);
  }, [courts]);

  // Separate hot courts (with check-ins) from regular courts
  const { hotCourts, regularCourts } = useMemo(() => {
    const hot: Court[] = [];
    const regular: Court[] = [];

    sortedCourts.forEach((court) => {
      const checkIns = courtActivity.get(court.id) || 0;
      if (checkIns > 0) {
        hot.push(court);
      } else {
        regular.push(court);
      }
    });

    // Sort hot courts by check-in count (descending)
    hot.sort((a, b) => {
      const aCount = courtActivity.get(a.id) || 0;
      const bCount = courtActivity.get(b.id) || 0;
      return bCount - aCount;
    });

    return { hotCourts: hot, regularCourts: regular };
  }, [sortedCourts, courtActivity]);

  // Debounced DB search — fires 400ms after the user stops typing
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const results = await searchCourts(trimmed);
      setSearchResults(results);
      setSearchLoading(false);
    }, 400);
    return () => {
      clearTimeout(timer);
      setSearchLoading(false);
    };
  }, [searchQuery]);

  // Filter based on active filter and advanced filters
  const filteredCourts = useMemo(() => {
    // While a search query is active, show DB search results directly
    if (searchQuery.trim().length >= 2) {
      return searchResults ?? [];
    }

    let base: Court[];
    switch (activeFilter) {
      case 'hot':
        base = hotCourts;
        break;
      case 'saved':
        base = sortedCourts.filter((c) => savedIds.includes(c.id));
        break;
      case 'all':
      default:
        base = sortedCourts;
    }

    return applyFilters(base, filters);
  }, [activeFilter, hotCourts, sortedCourts, savedIds, filters, searchQuery, searchResults]);

  // Suggestions — use global searchResults (no distance limit) when available, else local courts
  const { citySuggestions, courtSuggestions } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!searchFocused || q.length < 1) return { citySuggestions: [], courtSuggestions: [] };

    // Prefer the globally-fetched search results so distant courts (e.g. different city) still appear
    const source = searchResults && searchResults.length > 0 ? searchResults : sortedCourts;

    // Distinct cities matching the query
    const cityMap = new Map<string, { city: string; state: string | null; count: number }>();
    for (const c of source) {
      if (!c.city) continue;
      const key = `${c.city}|${c.state ?? ''}`;
      if (c.city.toLowerCase().includes(q) || (c.state ?? '').toLowerCase().includes(q)) {
        const entry = cityMap.get(key);
        if (entry) {
          entry.count += 1;
        } else {
          cityMap.set(key, { city: c.city, state: c.state ?? null, count: 1 });
        }
      }
    }

    // Courts matching by name or address
    const courtMatches = source
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.address ?? '').toLowerCase().includes(q)
      )
      .slice(0, 4);

    return {
      citySuggestions: [...cityMap.values()].slice(0, 2),
      courtSuggestions: courtMatches,
    };
  }, [searchQuery, searchFocused, sortedCourts, searchResults]);

  const loadCourts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const location = await getForegroundLocationOrDefault();
      const radiusMeters = 161000; // ~100 miles
      const data = await listCourtsNearby(
        location.coords.lat,
        location.coords.lon,
        radiusMeters
      );
      setCourts(data);

      // Fetch activity data for all courts
      if (supabaseStatus.configured && data.length > 0) {
        const courtIds = data.map((c) => c.id);
        const activity = await getCourtActivityBatch(courtIds);
        setCourtActivity(activity);
      }

      // Fetch weather per court location (service caches by ~5km grid so nearby courts share a request)
      const weatherEntries = await Promise.all(
        data.map(async (court) => {
          const w = await getWeatherForLocation(court.latitude, court.longitude);
          return [court.id, w] as [string, WeatherData | null];
        })
      );
      setCourtWeather(new Map(weatherEntries));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courts.");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [supabaseStatus.configured]);

  useEffect(() => {
    loadCourts();
  }, [loadCourts]);

  useEffect(() => {
    hydrateSavedCourts();
    return subscribeSavedCourts((ids) => {
      setSavedIds(ids);
    });
  }, []);

  // Load saved filters on mount
  useEffect(() => {
    loadFilters().then(setFilters);
  }, []);

  const handleApplyFilters = useCallback(async (newFilters: CourtFilters) => {
    setFilters(newFilters);
    await saveFilters(newFilters);
  }, []);

  // Subscribe to real-time activity updates so the list refreshes when anyone checks in/out
  useEffect(() => {
    if (!supabaseStatus.configured || courts.length === 0) return;
    const courtIds = courts.map((c) => c.id);
    const unsubscribe = subscribeToActivityUpdates(courtIds, setCourtActivity);
    return unsubscribe;
  }, [courts, supabaseStatus.configured]);

  // Subscribe to nearby check-ins for notifications
  useEffect(() => {
    if (!supabaseStatus.configured || courts.length === 0) {
      return;
    }

    let mounted = true;

    getAnonymousUserId().then((userId) => {
      if (!mounted) return;
      const unsubscribe = subscribeToNearbyCheckIns(courts, userId);
      return () => {
        unsubscribe();
      };
    });

    return () => {
      mounted = false;
    };
  }, [courts, supabaseStatus.configured]);

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <Pressable onPress={Keyboard.dismiss} className="px-6 pb-4" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center justify-center">
          <Image
            source={isDark
              ? require('@/assets/images/splash-icon-dark.png')
              : require('@/assets/images/splash-icon.png')
            }
            style={{ height: 42, width: undefined, aspectRatio: 3 }}
            resizeMode="contain"
          />
          {hotCourts.length > 0 && (
            <View className="absolute right-0 flex-row items-center rounded-full bg-brand/20 px-4 py-2">
              <View className="mr-2 h-2 w-2 animate-pulse rounded-full bg-brand" />
              <Text className="font-bold text-brand dark:text-brand-light">
                {hotCourts.length} {hotCourts.length === 1 ? 'game' : 'games'} live
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Search Bar */}
      <View className="px-6 pb-3" style={{ zIndex: 20 }}>
        <View className="flex-row items-center rounded-2xl border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5 px-3 py-2">
          <Ionicons
            name="search"
            size={16}
            color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search courts..."
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
          ) : searchQuery.length > 0 ? (
            <Pressable onPress={() => { setSearchQuery(''); setSearchResults(null); }} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={16}
                color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Instant suggestions dropdown */}
        {(citySuggestions.length > 0 || courtSuggestions.length > 0) && (
          <View
            className="absolute left-6 right-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900"
            style={{ top: 50, zIndex: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 }}
          >
            {/* City rows */}
            {citySuggestions.map((item, i) => (
              <Pressable
                key={`city-${item.city}-${item.state}`}
                onPress={() => {
                  setSearchQuery(item.city);
                  setSearchFocused(false);
                }}
                className={`flex-row items-center gap-3 px-4 py-3 ${
                  i < citySuggestions.length - 1 || courtSuggestions.length > 0
                    ? 'border-b border-gray-100 dark:border-white/5'
                    : ''
                }`}
              >
                <Ionicons name="business-outline" size={16} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
                    {item.city}{item.state ? `, ${item.state}` : ''}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-white/50">
                    {item.count} {item.count === 1 ? 'court' : 'courts'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
              </Pressable>
            ))}

            {/* Court rows */}
            {courtSuggestions.map((court, i) => {
              const distMi = court.distance_meters != null
                ? (court.distance_meters / 1609.34).toFixed(1)
                : null;
              return (
                <Pressable
                  key={court.id}
                  onPress={() => {
                    setSearchFocused(false);
                    setSearchQuery('');
                    setSearchResults(null);
                    router.push(`/court/${court.id}`);
                  }}
                  className={`flex-row items-center gap-3 px-4 py-3 ${i < courtSuggestions.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
                >
                  <Ionicons name="location-outline" size={16} color="#960000" />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
                      {court.name}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-white/50" numberOfLines={1}>
                      {[distMi ? `${distMi} mi` : null, court.city, court.state].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Filter Chips */}
      <View className="pb-4 px-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => { setActiveFilter('all'); setSearchQuery(''); setSearchResults(null); }}
              className={`flex-row items-center rounded-full px-4 py-2 ${
                activeFilter === 'all'
                  ? 'bg-brand'
                  : 'border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5'
              }`}
              accessibilityLabel="Show all courts"
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === 'all' }}
            >
              <Ionicons
                name="location"
                size={16}
                color={activeFilter === 'all' ? '#ffffff' : '#960000'}
              />
              <Text
                className={`ml-1.5 text-sm font-semibold ${
                  activeFilter === 'all' ? 'text-white' : 'text-gray-600 dark:text-white/70'
                }`}
              >
                All Courts
              </Text>
            </Pressable>

            {hotCourts.length > 0 && (
              <Pressable
                onPress={() => { setActiveFilter('hot'); setSearchQuery(''); setSearchResults(null); }}
                className={`flex-row items-center rounded-full px-4 py-2 ${
                  activeFilter === 'hot'
                    ? 'bg-brand'
                    : 'border border-brand/30 bg-brand/10'
                }`}
                accessibilityLabel={`Show hot courts with active players, ${hotCourts.length} courts available`}
                accessibilityRole="button"
                accessibilityState={{ selected: activeFilter === 'hot' }}
              >
                <Ionicons
                  name="flame"
                  size={16}
                  color={activeFilter === 'hot' ? '#ffffff' : '#960000'}
                />
                <Text
                  className={`ml-1.5 text-sm font-semibold ${
                    activeFilter === 'hot' ? 'text-white' : 'text-brand dark:text-brand-light'
                  }`}
                >
                  Hot Now ({hotCourts.length})
                </Text>
              </Pressable>
            )}

            {savedIds.length > 0 && (
              <Pressable
                onPress={() => { setActiveFilter('saved'); setSearchQuery(''); setSearchResults(null); }}
                className={`flex-row items-center rounded-full px-4 py-2 ${
                  activeFilter === 'saved'
                    ? 'bg-vibrant-gold'
                    : 'border border-vibrant-gold/30 bg-vibrant-gold/10'
                }`}
                accessibilityLabel={`Show saved courts, ${savedIds.length} courts saved`}
                accessibilityRole="button"
                accessibilityState={{ selected: activeFilter === 'saved' }}
              >
                <Ionicons
                  name="star"
                  size={16}
                  color={activeFilter === 'saved' ? '#000000' : '#FFD700'}
                />
                <Text
                  className={`ml-1.5 text-sm font-semibold ${
                    activeFilter === 'saved' ? 'text-black' : 'text-vibrant-gold'
                  }`}
                >
                  Saved ({savedIds.length})
                </Text>
              </Pressable>
            )}

            {/* Filter Button */}
            <Pressable
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterModalVisible(true);
              }}
              testID="filter-button"
              className={`flex-row items-center rounded-full px-4 py-2 ${
                hasActiveFilters(filters)
                  ? 'bg-brand'
                  : 'border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/5'
              }`}
              accessibilityLabel={hasActiveFilters(filters) ? 'Open filters, filters active' : 'Open filters'}
              accessibilityRole="button"
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={hasActiveFilters(filters) ? '#fff' : (isDark ? '#ffffff99' : '#666')}
              />
              <Text
                className={`ml-2 text-sm font-semibold ${
                  hasActiveFilters(filters) ? 'text-white' : 'text-gray-600 dark:text-white/70'
                }`}
              >
                Filters
              </Text>
              {hasActiveFilters(filters) && (
                <View className="ml-1 h-2 w-2 rounded-full bg-white" />
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* Courts List */}
      {loading ? (
        <View className="px-6">
          <Text className="mb-4 text-lg font-semibold text-gray-700 dark:text-white/80">
            Finding courts...
          </Text>
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <View
                key={`skeleton-${index}`}
                className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900"
              >
                <View className="h-1 bg-gray-200 dark:bg-white/10" />
                <View className="p-4">
                  <View className="h-5 w-2/3 rounded-lg bg-gray-200 dark:bg-white/10" />
                  <View className="mt-3 h-3 w-3/4 rounded-lg bg-gray-100 dark:bg-white/5" />
                  <View className="mt-3 flex-row gap-2">
                    <View className="h-6 w-20 rounded-lg bg-gray-100 dark:bg-white/5" />
                    <View className="h-6 w-20 rounded-lg bg-gray-100 dark:bg-white/5" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : error ? (
        <View className="mx-6 items-center rounded-2xl border border-status-error/30 bg-status-error/10 p-6">
          <Text className="text-6xl">⚠️</Text>
          <Text className="mt-3 text-center font-semibold text-gray-900 dark:text-white">
            Oops! Something went wrong
          </Text>
          <Text className="mt-2 text-center text-gray-600 dark:text-white/60">{error}</Text>
          <Pressable
            onPress={() => loadCourts()}
            className="mt-4 rounded-full bg-brand px-6 py-3"
          >
            <Text className="font-semibold text-white">Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredCourts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <BasketballRefreshControl
              refreshing={refreshing}
              onRefresh={() => loadCourts(true)}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 32 }}
          onScrollBeginDrag={closeCurrentSwipeable}
          onMomentumScrollBegin={closeCurrentSwipeable}
          ListEmptyComponent={
            <View className="gap-3">
              <View className="items-center rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 p-8">
                <Ionicons
                  name={
                    searchQuery.trim() ? 'search' :
                    activeFilter === 'hot' ? 'flame' :
                    activeFilter === 'saved' ? 'star' : 'location'
                  }
                  size={40}
                  color={
                    activeFilter === 'saved' && !searchQuery.trim() ? '#FFD700' : '#960000'
                  }
                />
                <Text className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
                  {searchQuery.trim()
                    ? 'No courts match your search'
                    : activeFilter === 'hot'
                      ? 'No active games right now'
                      : activeFilter === 'saved'
                        ? 'No saved courts yet'
                        : 'No courts found'}
                </Text>
                <Text className="mt-2 text-center text-gray-600 dark:text-white/60">
                  {searchQuery.trim()
                    ? 'Try a different name or address'
                    : activeFilter === 'hot'
                      ? 'Be the first to check in at a court!'
                      : activeFilter === 'saved'
                        ? 'Save courts to quickly find them later'
                        : 'Try adjusting your location'}
                </Text>
              </View>

              {/* Submit court nudge — only shown when a search has no results */}
              {searchQuery.trim().length >= 2 && !searchLoading && (
                <Pressable
                  onPress={() => router.push('/submit-court')}
                  className="flex-row items-center justify-between rounded-2xl border border-brand/30 bg-brand/10 px-5 py-4"
                >
                  <View className="flex-1 flex-row items-center gap-3">
                    <Ionicons name="add-circle-outline" size={22} color="#960000" />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-brand dark:text-brand-light">
                        Know this court?
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-white/50">
                        Submit it and help the community find it
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#960000" />
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            filteredCourts.length > 0 ? (
              <Pressable
                onPress={() => router.push('/submit-court')}
                className="mt-3 mb-8 flex-row items-center justify-between rounded-2xl border border-brand/25 bg-brand/8 px-5 py-4"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="add-circle-outline" size={22} color="#960000" />
                  <View>
                    <Text className="text-sm font-semibold text-brand dark:text-brand-light">
                      Know a court we're missing?
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-white/50">
                      Submit it and help the community
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#960000" />
              </Pressable>
            ) : null
          }
          renderItem={({ item, index }) => {
            const checkIns = courtActivity.get(item.id) || 0;
            const isHot = checkIns > 0 && activeFilter !== 'saved';

            return (
              <SwipeableCourtCard
                court={item}
                index={index}
                checkInsCount={checkIns}
                weather={courtWeather.get(item.id) ?? null}
                isHot={isHot}
              />
            );
          }}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
      />
      </View>
    </GestureHandlerRootView>
  );
}
