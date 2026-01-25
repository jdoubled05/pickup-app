import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Court, getCourtById } from "@/src/services/courts";

export default function CourtDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const courtId = Array.isArray(id) ? id[0] : id;
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCourt = async () => {
      if (!courtId) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      const data = await getCourtById(courtId);
      if (isMounted) {
        setCourt(data);
        setLoading(false);
      }
    };

    loadCourt();

    return () => {
      isMounted = false;
    };
  }, [courtId]);

  return (
    <View className="flex-1 bg-black px-6 py-6">
      <Text className="text-2xl font-bold">Court Details</Text>
      <Text className="mt-2 text-white/70">Court ID: {courtId ?? "Unknown"}</Text>

      {loading ? (
        <Text className="mt-6 text-white/70">Loading court...</Text>
      ) : court ? (
        <View className="mt-6">
          <Text className="text-xl font-semibold">{court.name}</Text>
          <Text className="mt-2 text-white/70">{court.address ?? "Address unknown"}</Text>
          <Text className="mt-4 text-white/70">
            Type: {court.courtType ?? "Unknown"}
          </Text>
          <Text className="mt-2 text-white/70">
            Surface: {court.surfaceType ?? "Unknown"}
          </Text>
          <Text className="mt-2 text-white/70">
            Hoops: {court.numberOfHoops ?? "Unknown"}
          </Text>
          <Text className="mt-2 text-white/70">
            Lighting:{" "}
            {court.lighting === null || court.lighting === undefined
              ? "Unknown"
              : court.lighting
              ? "Yes"
              : "No"}
          </Text>
          <Text className="mt-2 text-white/70">
            Coordinates: {court.latitude}, {court.longitude}
          </Text>
        </View>
      ) : (
        <Text className="mt-6 text-white/70">Court not found.</Text>
      )}
    </View>
  );
}
