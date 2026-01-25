import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { Section } from "@/src/components/ui/Section";
import { getSupabaseEnvStatus } from "@/src/services/supabase";
import {
  Court,
  formatCourtMeta,
  formatLastVerified,
  getCourtById,
} from "@/src/services/courts";

export default function CourtDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const courtId = Array.isArray(id) ? id[0] : id;
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseStatus = getSupabaseEnvStatus();

  const loadCourt = useCallback(async () => {
    if (!courtId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getCourtById(courtId);
      setCourt(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load court.");
    } finally {
      setLoading(false);
    }
  }, [courtId]);

  useEffect(() => {
    loadCourt();
  }, [loadCourt]);

  return (
    <View className="flex-1 bg-black px-6 py-6">
      {loading ? (
        <View>
          <Text className="text-2xl font-bold text-white/40">Loading court...</Text>
          <Text className="mt-3 text-white/20">Loading address...</Text>
          <Text className="mt-2 text-white/20">Loading details...</Text>
        </View>
      ) : error ? (
        <View>
          <Text className="text-2xl font-bold">Court Details</Text>
          <Text className="mt-1 text-white/50">
            {supabaseStatus.configured ? "Live data" : "Mock data"}
          </Text>
          <Text className="mt-2 text-white/70">Error: {error}</Text>
          <View className="mt-6">
            <Button title="Retry" onPress={loadCourt} variant="secondary" />
          </View>
        </View>
      ) : court ? (
        <View>
          <Text className="text-3xl font-bold">{court.name}</Text>
          <Text className="mt-1 text-white/50">
            {supabaseStatus.configured ? "Live data" : "Mock data"}
          </Text>
          <Text className="mt-2 text-white/70">{court.address ?? "Address unknown"}</Text>
          <Text className="mt-3 text-white/60">{formatCourtMeta(court)}</Text>

          <View className="mt-5">
            <Button title="Refresh" onPress={loadCourt} variant="secondary" />
          </View>

          <Section title="Details">
            <Text className="mt-2 text-white/70">
              Type: {court.court_type ?? "Unknown"}
            </Text>
            <Text className="mt-2 text-white/70">
              Surface: {court.surface_type ?? "Unknown"}
            </Text>
            <Text className="mt-2 text-white/70">
              Hoops: {court.number_of_hoops ?? "Unknown"}
            </Text>
            <Text className="mt-2 text-white/70">
              Lighting:{" "}
              {court.lighting === null || court.lighting === undefined
                ? "Unknown"
                : court.lighting
                ? "Yes"
                : "No"}
            </Text>
          </Section>

          <Section title="Hours">
            <Text className="text-white/70">{court.open_hours ?? "Not provided"}</Text>
          </Section>

          <Section title="Verification">
            <Text className="text-white/70">
              {formatLastVerified(court) ?? "Not verified yet"}
            </Text>
          </Section>

          <Section title="Coordinates">
            <Text className="text-white/70">
              {Number.isFinite(court.latitude) && Number.isFinite(court.longitude)
                ? `${court.latitude}, ${court.longitude}`
                : "Unknown"}
            </Text>
          </Section>
        </View>
      ) : (
        <View>
          <Text className="text-2xl font-bold">Court Details</Text>
          <Text className="mt-1 text-white/50">
            {supabaseStatus.configured ? "Live data" : "Mock data"}
          </Text>
          <Text className="mt-2 text-white/70">Court not found.</Text>
          <View className="mt-6">
            <Link href="/courts" asChild>
              <Button title="Back to Courts" variant="secondary" />
            </Link>
          </View>
        </View>
      )}
    </View>
  );
}
