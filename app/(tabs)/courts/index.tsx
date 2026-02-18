import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, View, ScrollView, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { SwipeableCourtCard } from "@/src/components/SwipeableCourtCard";
import { BasketballRefreshControl } from "@/src/components/BasketballRefreshControl";
import { FilterModal } from "@/src/components/FilterModal";
import { Court, listCourtsNearby } from "@/src/services/courts";
import { getForegroundLocationOrDefault } from "@/src/services/location";
import { getSupabaseEnvStatus } from "@/src/services/supabase";
import { hydrateSavedCourts, subscribeSavedCourts } from "@/src/services/savedCourts";
import { getCourtActivityBatch } from "@/src/services/courtActivity";
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
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filters, setFilters] = useState<CourtFilters>(DEFAULT_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const supabaseStatus = getSupabaseEnvStatus();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  // Filter based on active filter and advanced filters
  const filteredCourts = useMemo(() => {
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

    // Apply advanced filters
    return applyFilters(base, filters);
  }, [activeFilter, hotCourts, sortedCourts, savedIds, filters]);

  const loadCourts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const location = await getForegroundLocationOrDefault();
      const radiusMeters = 50000;
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

      // Fetch weather for user location
      const weatherData = await getWeatherForLocation(
        location.coords.lat,
        location.coords.lon
      );
      setWeather(weatherData);
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
      <View className="px-6 pb-4 pt-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-4xl font-extrabold text-gray-900 dark:text-white">PICKUP</Text>
            <View className="mt-1 h-1 w-16 rounded-full bg-brand" />
          </View>
          {hotCourts.length > 0 && (
            <View className="flex-row items-center rounded-full bg-brand/20 px-4 py-2">
              <View className="mr-2 h-2 w-2 animate-pulse rounded-full bg-brand" />
              <Text className="font-bold text-brand dark:text-brand-light">
                {hotCourts.length} {hotCourts.length === 1 ? 'game' : 'games'} live
              </Text>
            </View>
          )}
        </View>
        <Text className="mt-2 text-base text-gray-500 dark:text-white/60">
          Find your next game 🏀
        </Text>
      </View>

      {/* Filter Chips */}
      <View className="pb-4 px-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setActiveFilter('all')}
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
                onPress={() => setActiveFilter('hot')}
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
                onPress={() => setActiveFilter('saved')}
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 p-8">
              <Text className="text-6xl">
                {activeFilter === 'hot' ? '🏀' : activeFilter === 'saved' ? '⭐' : '📍'}
              </Text>
              <Text className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
                {activeFilter === 'hot'
                  ? 'No active games right now'
                  : activeFilter === 'saved'
                    ? 'No saved courts yet'
                    : 'No courts found'}
              </Text>
              <Text className="mt-2 text-center text-gray-600 dark:text-white/60">
                {activeFilter === 'hot'
                  ? 'Be the first to check in at a court!'
                  : activeFilter === 'saved'
                    ? 'Save courts to quickly find them later'
                    : 'Try adjusting your location'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const checkIns = courtActivity.get(item.id) || 0;
            const isHot = checkIns > 0 && activeFilter !== 'saved';

            return (
              <SwipeableCourtCard
                court={item}
                index={index}
                checkInsCount={checkIns}
                weather={weather}
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
