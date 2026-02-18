import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Link } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { CourtCard } from "@/src/components/CourtCard";
import {
  Court,
  listCourtsNearby,
} from "@/src/services/courts";
import { getForegroundLocationOrDefault } from "@/src/services/location";
import { getSupabaseEnvStatus } from "@/src/services/supabase";
import { hydrateSavedCourts, subscribeSavedCourts } from "@/src/services/savedCourts";

export default function CourtsIndex() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<"device" | "default">(
    "default"
  );
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [queryContext, setQueryContext] = useState<{
    lat: number;
    lon: number;
    radiusMeters: number;
  }>({ lat: 33.749, lon: -84.388, radiusMeters: 50000 });
  const supabaseStatus = getSupabaseEnvStatus();
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

  const loadCourts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const location = await getForegroundLocationOrDefault();
      setLocationSource(location.source);
      const radiusMeters = 50000;
      setQueryContext({
        lat: location.coords.lat,
        lon: location.coords.lon,
        radiusMeters,
      });
      const data = await listCourtsNearby(
        location.coords.lat,
        location.coords.lon,
        radiusMeters
      );
      setCourts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courts.");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadCourts();
  }, [loadCourts]);

  useEffect(() => {
    hydrateSavedCourts();
    return subscribeSavedCourts((ids) => {
      setSavedIds(ids);
      setSavedCount(ids.length);
    });
  }, []);

  return (
    <View className="flex-1 bg-bg-primary px-6 py-6">
      {/* Header */}
      <View className="mb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-4xl font-extrabold text-white">Courts</Text>
            <View className="mt-1 h-1 w-16 rounded-full bg-accent" />
          </View>
          <View className="rounded-full bg-accent/20 px-4 py-2">
            <Text className="font-semibold text-accent">
              {courts.length} nearby
            </Text>
          </View>
        </View>
        <Text className="mt-3 text-base text-white/60">
          Find your next pickup game 🏀
        </Text>
      </View>

      {/* Saved Courts Quick Access */}
      {savedCount > 0 && (
        <View className="mb-4">
          <Link href="/saved" asChild>
            <Pressable className="flex-row items-center justify-between rounded-2xl border border-vibrant-gold/30 bg-vibrant-gold/10 px-4 py-4">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-vibrant-gold/20">
                  <Text className="text-xl">⭐</Text>
                </View>
                <View>
                  <Text className="font-semibold text-vibrant-gold">Saved Courts</Text>
                  <Text className="mt-0.5 text-sm text-white/50">
                    {savedCount} {savedCount === 1 ? 'court' : 'courts'} saved
                  </Text>
                </View>
              </View>
              <Text className="text-2xl text-vibrant-gold/50">›</Text>
            </Pressable>
          </Link>
        </View>
      )}

      {loading ? (
        <View className="mt-6">
          <Text className="mb-4 text-lg font-semibold text-white/80">
            Finding courts...
          </Text>
          <View className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <View
                key={`skeleton-${index}`}
                className="overflow-hidden rounded-2xl border border-white/10 bg-bg-secondary"
              >
                <View className="h-1 bg-white/10" />
                <View className="p-4">
                  <View className="h-5 w-2/3 rounded-lg bg-white/10" />
                  <View className="mt-3 h-3 w-3/4 rounded-lg bg-white/5" />
                  <View className="mt-3 flex-row gap-2">
                    <View className="h-6 w-20 rounded-lg bg-white/5" />
                    <View className="h-6 w-20 rounded-lg bg-white/5" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : error ? (
        <View className="mt-6 items-center rounded-2xl border border-status-error/30 bg-status-error/10 p-6">
          <Text className="text-6xl">⚠️</Text>
          <Text className="mt-3 text-center font-semibold text-white">
            Oops! Something went wrong
          </Text>
          <Text className="mt-2 text-center text-white/60">{error}</Text>
          <Pressable
            onPress={() => loadCourts()}
            className="mt-4 rounded-full bg-accent px-6 py-3"
          >
            <Text className="font-semibold text-white">Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          className="mt-4"
          data={sortedCourts}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => loadCourts(true)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center rounded-2xl border border-white/10 bg-bg-secondary p-8">
              <Text className="text-6xl">🏀</Text>
              <Text className="mt-4 text-center text-lg font-semibold text-white">
                No courts found
              </Text>
              <Text className="mt-2 text-center text-white/60">
                {supabaseStatus.configured
                  ? "Try adjusting your location or check back later"
                  : "Connect to Supabase to see courts"}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <CourtCard court={item} index={index} />
          )}
        />
      )}
    </View>
  );
}
