import React, { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Link } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Court, listCourtsNearby } from "@/src/services/courts";

export default function CourtsIndex() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCourts = async () => {
      try {
        const data = await listCourtsNearby(38.9072, -77.0369, 5000);
        if (isMounted) {
          setCourts(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load courts.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCourts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-black px-6 py-6">
      <Text className="text-2xl font-bold">Courts</Text>
      <Text className="mt-2 text-white/70">
        Nearby courts powered by Supabase (mocked for now).
      </Text>

      {loading ? (
        <Text className="mt-6 text-white/70">Loading courts...</Text>
      ) : error ? (
        <Text className="mt-6 text-white/70">Error: {error}</Text>
      ) : (
        <FlatList
          className="mt-6"
          data={courts}
          keyExtractor={(item) => item.id}
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

            return (
              <Link href={`/courts/${item.id}`} asChild>
                <Pressable className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Text className="text-lg font-semibold">{item.name}</Text>
                  <Text className="mt-1 text-white/70">{item.address ?? "Address unknown"}</Text>
                  <Text className="mt-2 text-white/60">
                    {courtType} • {hoops} hoops • {lighting}
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
