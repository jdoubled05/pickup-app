import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Link } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import {
  Court,
  formatAddress,
  formatDistance,
  formatHoops,
  formatIndoor,
  listCourtsNearby,
} from "@/src/services/courts";
import { getForegroundLocationOrDefault } from "@/src/services/location";
import { getSupabaseEnvStatus } from "@/src/services/supabase";

export default function CourtsIndex() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<"device" | "default">(
    "default"
  );
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

  return (
    <View className="flex-1 bg-black px-6 py-6">
      <Text className="text-2xl font-bold">Courts</Text>
      <Text className="mt-2 text-white/70">
        Nearby courts powered by Supabase (mocked for now).
      </Text>
      <Text className="mt-1 text-white/50">
        {supabaseStatus.configured ? "Live data" : "Mock data"}
      </Text>
      <Text className="mt-1 text-white/50">
        {locationSource === "device"
          ? "Using device location"
          : "Using default location (Atlanta)"}
      </Text>
      <Text className="mt-1 text-white/40">
        {`source: ${locationSource} • ${queryContext.lat.toFixed(4)}, ${queryContext.lon.toFixed(
          4
        )} • ${(queryContext.radiusMeters / 1000).toFixed(0)} km`}
      </Text>

      <View className="mt-4">
        <Button
          title={refreshing ? "Refreshing..." : "Refresh"}
          variant="secondary"
          onPress={() => loadCourts(true)}
        />
      </View>

      {loading ? (
        <View className="mt-6">
          <Text className="text-white/70">Loading courts...</Text>
          <View className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <View
                key={`skeleton-${index}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <View className="h-4 w-2/3 rounded-full bg-white/10" />
                <View className="mt-3 h-3 w-3/4 rounded-full bg-white/10" />
                <View className="mt-3 h-3 w-1/2 rounded-full bg-white/10" />
              </View>
            ))}
          </View>
        </View>
      ) : error ? (
        <Text className="mt-6 text-white/70">Error: {error}</Text>
      ) : (
        <FlatList
          className="mt-6"
          data={sortedCourts}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => loadCourts(true)}
          ListEmptyComponent={
            <View>
              <Text className="text-white/70">
                {supabaseStatus.configured
                  ? "No courts found near you."
                  : "No courts found yet."}
              </Text>
              {supabaseStatus.configured ? (
                <Text className="mt-2 text-white/50">
                  Try increasing radius or changing simulator location.
                </Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const courtType = formatIndoor(item.indoor).toLowerCase();
            const hoops = formatHoops(item.num_hoops);
            const lighting =
              item.lighting === null || item.lighting === undefined
                ? "lighting unknown"
                : item.lighting
                ? "lighting yes"
                : "lighting no";
            const distance = formatDistance(item.distance_meters);

            return (
              <Link
                href={{ pathname: "/courts/[id]", params: { id: item.id } }}
                asChild
              >
                <Pressable className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Text className="text-lg font-semibold">{item.name}</Text>
                  <Text className="mt-1 text-white/70">{formatAddress(item)}</Text>
                  <Text className="mt-2 text-white/60">
                    {courtType} • {hoops} • {lighting}
                    {distance ? ` • ${distance}` : ""}
                  </Text>
                </Pressable>
              </Link>
            );
          }}
        />
      )}
    </View>
  );
}
