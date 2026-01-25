import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Link } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { Court, listCourtsNearby } from "@/src/services/courts";
import { getSupabaseEnvStatus } from "@/src/services/supabase";

export default function CourtsIndex() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseStatus = getSupabaseEnvStatus();

  const formatDistance = (distanceMeters?: number) => {
    if (distanceMeters === null || distanceMeters === undefined) {
      return null;
    }
    const miles = distanceMeters / 1609.34;
    if (!Number.isFinite(miles)) {
      return null;
    }
    if (miles < 0.1) {
      return "<0.1 mi";
    }
    return `${miles.toFixed(1)} mi`;
  };

  const loadCourts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // TODO: Replace with device location once geolocation is enabled.
      const data = await listCourtsNearby(33.749, -84.388, 50000);
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

      <View className="mt-4">
        <Button
          title={refreshing ? "Refreshing..." : "Refresh"}
          variant="secondary"
          onPress={() => loadCourts(true)}
        />
      </View>

      {loading ? (
        <Text className="mt-6 text-white/70">Loading courts...</Text>
      ) : error ? (
        <Text className="mt-6 text-white/70">Error: {error}</Text>
      ) : (
        <FlatList
          className="mt-6"
          data={courts}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => loadCourts(true)}
          ListEmptyComponent={<Text className="text-white/70">No courts found yet.</Text>}
          renderItem={({ item }) => {
            const courtType = item.court_type ?? "court";
            const hoops = item.number_of_hoops ?? "?";
            const lighting =
              item.lighting === null || item.lighting === undefined
                ? "lighting unknown"
                : item.lighting
                ? "lighting yes"
                : "lighting no";
            const distance = formatDistance(item.distanceMeters);

            return (
              <Link href={`/courts/${item.id}`} asChild>
                <Pressable className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Text className="text-lg font-semibold">{item.name}</Text>
                  <Text className="mt-1 text-white/70">{item.address ?? "Address unknown"}</Text>
                  <Text className="mt-2 text-white/60">
                    {courtType} • {hoops} hoops • {lighting}
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
