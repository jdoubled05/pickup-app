import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import {
  formatAddress,
  formatCourtMeta,
  getCourtById,
} from "@/src/services/courts";
import {
  hydrateSavedCourts,
  removeSavedCourt,
  subscribeSavedCourts,
} from "@/src/services/savedCourts";

export default function SavedCourtsScreen() {
  const router = useRouter();
  const [savedIds, setSavedIds] = React.useState<string[]>([]);
  const [savedCourts, setSavedCourts] = React.useState<Array<{ id: string; name: string }>>(
    []
  );
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    hydrateSavedCourts();
    return subscribeSavedCourts((ids) => setSavedIds(ids));
  }, []);

  React.useEffect(() => {
    let active = true;

    const loadSaved = async () => {
      setLoading(true);
      if (savedIds.length === 0) {
        if (active) {
          setSavedCourts([]);
          setLoading(false);
        }
        return;
      }

      const results: Array<{
        id: string;
        name: string;
        address: string;
        meta: string;
      } | null> = new Array(savedIds.length).fill(null);
      const invalidIds: string[] = [];
      const concurrency = 4;
      let cursor = 0;

      const worker = async () => {
        while (cursor < savedIds.length) {
          const index = cursor;
          cursor += 1;
          const id = savedIds[index];
          try {
            const data = await getCourtById(id);
            if (data) {
              results[index] = {
                id: data.id,
                name: data.name,
                address: formatAddress(data),
                meta: formatCourtMeta(data),
              };
            } else {
              invalidIds.push(id);
            }
          } catch {
            invalidIds.push(id);
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      if (active) {
        if (invalidIds.length > 0) {
          await Promise.all(invalidIds.map((id) => removeSavedCourt(id)));
        }
        setSavedCourts(results.filter(Boolean) as Array<{
          id: string;
          name: string;
          address: string;
          meta: string;
        }>);
        setLoading(false);
      }
    };

    loadSaved();

    return () => {
      active = false;
    };
  }, [savedIds]);

  return (
    <View className="flex-1 bg-white dark:bg-black px-6 py-6">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">{`Saved Courts (${savedIds.length})`}</Text>
      <Text className="mt-2 text-gray-600 dark:text-white/70">Your saved courts are stored locally.</Text>

      {loading ? (
        <View className="mt-6">
          <Text className="text-gray-600 dark:text-white/70">Loading saved courts...</Text>
          <View className="mt-4 space-y-3">
            {Array.from({ length: Math.min(savedIds.length || 3, 3) }).map(
              (_, index) => (
                <View
                  key={`saved-skeleton-${index}`}
                  className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4"
                >
                  <View className="h-4 w-2/3 rounded-full bg-gray-200 dark:bg-white/10" />
                  <View className="mt-3 h-3 w-3/4 rounded-full bg-gray-200 dark:bg-white/10" />
                  <View className="mt-3 h-3 w-1/2 rounded-full bg-gray-200 dark:bg-white/10" />
                </View>
              )
            )}
          </View>
        </View>
      ) : savedCourts.length === 0 ? (
        <View className="mt-6">
          <Text className="text-gray-500 dark:text-white/60">
            No saved courts yet. Save a court from its detail screen.
          </Text>
        </View>
      ) : (
        <View className="mt-6 space-y-3">
          {savedCourts.map((court) => (
            <View
              key={court.id}
              className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4"
            >
              <Pressable
                onPress={() => router.push(`/court/${court.id}`)}
                accessibilityLabel={`View details for ${court.name}, ${court.address}`}
                accessibilityRole="button"
              >
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">{court.name}</Text>
                <Text className="mt-1 text-gray-600 dark:text-white/70">{court.address}</Text>
                <Text className="mt-2 text-gray-500 dark:text-white/60">{court.meta}</Text>
              </Pressable>
              <View className="mt-3">
                <Button
                  title="Remove"
                  variant="secondary"
                  onPress={() => removeSavedCourt(court.id)}
                  accessibilityLabel={`Remove ${court.name} from saved courts`}
                  accessibilityRole="button"
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
