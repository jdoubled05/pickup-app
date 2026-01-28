import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { Section } from "@/src/components/ui/Section";
import { getSupabaseEnvStatus } from "@/src/services/supabase";
import {
  isCourtSaved,
  hydrateSavedCourts,
  subscribeSavedCourts,
  toggleSavedCourt,
} from "@/src/services/savedCourts";
import {
  Court,
  formatAddress,
  formatHours,
  formatHoops,
  formatIndoor,
  formatCourtMeta,
  getCourtById,
} from "@/src/services/courts";

export default function CourtDetails() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const courtId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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

  useEffect(() => {
    if (!courtId) {
      return;
    }
    hydrateSavedCourts().then((ids) => {
      setSaved(ids.includes(courtId));
    });
    return subscribeSavedCourts((ids) => setSaved(ids.includes(courtId)));
  }, [courtId]);

  return (
    <View className="flex-1 bg-black px-6 py-6">
      {!courtId ? (
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
      ) : loading ? (
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
          <Text className="mt-2 text-white/70">{formatAddress(court)}</Text>
          <Text className="mt-3 text-white/60">{formatCourtMeta(court)}</Text>

          <View className="mt-5">
            <View className="flex-row gap-3">
              <Button title="Refresh" onPress={loadCourt} variant="secondary" />
              <Button
                title={saved ? "Saved" : "Save"}
                onPress={() => {
                  toggleSavedCourt(court.id);
                }}
                variant={saved ? "secondary" : "primary"}
              />
            </View>
          </View>

          <Section title="Details">
            <Text className="mt-2 text-white/70">
              {formatIndoor(court.indoor)}
            </Text>
            <Text className="mt-2 text-white/70">
              Surface: {court.surface_type ?? "Unknown"}
            </Text>
            <Text className="mt-2 text-white/70">
              {formatHoops(court.num_hoops)}
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
            <Text className="text-white/70">
              {court.open_24h ? "Open 24 hours" : formatHours(court.hours_json)}
            </Text>
          </Section>

          <Section title="Location">
            <Text className="text-white/70">
              {court.city || court.state || court.postal_code
                ? [court.city, court.state, court.postal_code].filter(Boolean).join(", ")
                : "Not provided"}
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
