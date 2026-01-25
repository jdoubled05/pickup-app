import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Link } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { Court, listCourtsNearby } from "@/src/services/courts";

export default function CourtsIndex() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCourts = async () => {
      const data = await listCourtsNearby(37.7749, -122.4194, 5000);
      if (isMounted) {
        setCourts(data);
        setLoading(false);
      }
    };

    loadCourts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView className="flex-1 bg-black px-6 py-6">
      <Text className="text-2xl font-bold">Courts</Text>
      <Text className="mt-2 text-white/70">
        Nearby courts powered by Supabase (mocked for now).
      </Text>

      {loading ? (
        <Text className="mt-6 text-white/70">Loading courts...</Text>
      ) : (
        <View className="mt-6">
          {courts.length === 0 ? (
            <Text className="text-white/70">No courts found yet.</Text>
          ) : (
            courts.map((court) => (
              <Link key={court.id} href={`/courts/${court.id}`} asChild>
                <Button
                  title={`${court.name} • ${court.courtType ?? "court"}`}
                  variant="secondary"
                  className="mb-3"
                />
              </Link>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}
