import React, { useCallback, useEffect, useState, useRef } from "react";
import { View, Pressable, ScrollView, Animated, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { PhotoGallery } from "@/src/components/PhotoGallery";
import { PhotoUpload } from "@/src/components/PhotoUpload";
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
  getCourtById,
} from "@/src/services/courts";
import { openDirections } from "@/src/utils/directions";
import {
  toggleCheckIn,
  isCheckedInAtCourt,
  subscribeToCheckIns,
} from "@/src/services/checkins";
import { ReportModal } from "@/src/components/ReportModal";

export default function CourtDetails() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const courtId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [checkInsCount, setCheckInsCount] = useState(0);
  const [isUserCheckedIn, setIsUserCheckedIn] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const insets = useSafeAreaInsets();
  const supabaseStatus = getSupabaseEnvStatus();

  // Pulsing animation for live indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  const handleGetDirections = useCallback(() => {
    if (!court) return;
    const { latitude, longitude, name } = court;
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }
    openDirections(latitude, longitude, name);
  }, [court]);

  const handleToggleCheckIn = useCallback(async () => {
    if (!courtId || checkInLoading) return;

    // Haptic feedback on press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setCheckInLoading(true);

    // Optimistic UI update
    const previousState = isUserCheckedIn;
    const previousCount = checkInsCount;
    setIsUserCheckedIn(!isUserCheckedIn);
    setCheckInsCount(isUserCheckedIn ? checkInsCount - 1 : checkInsCount + 1);

    try {
      const success = await toggleCheckIn(courtId);

      if (!success) {
        // Revert on failure
        setIsUserCheckedIn(previousState);
        setCheckInsCount(previousCount);
      } else {
        // Success haptic
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      // Revert on error
      setIsUserCheckedIn(previousState);
      setCheckInsCount(previousCount);
      console.error("Failed to toggle check-in:", err);
    } finally {
      setCheckInLoading(false);
    }
  }, [courtId, isUserCheckedIn, checkInsCount, checkInLoading]);

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

  // Subscribe to check-ins real-time updates
  useEffect(() => {
    if (!courtId || !supabaseStatus.configured) {
      return;
    }

    // Load initial check-in status
    isCheckedInAtCourt(courtId).then(setIsUserCheckedIn);

    // Subscribe to check-ins count changes
    const unsubscribe = subscribeToCheckIns(courtId, setCheckInsCount);

    return () => {
      unsubscribe();
    };
  }, [courtId, supabaseStatus.configured]);

  // Pulsing animation for live activity indicator
  useEffect(() => {
    if (checkInsCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [checkInsCount, pulseAnim]);

  return (
    <>
    <ScrollView className="flex-1 bg-white dark:bg-black">
      {!courtId ? (
        <View className="px-6 py-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Court Details</Text>
          <Text className="mt-2 text-gray-600 dark:text-white/70">Court not found.</Text>
          <View className="mt-6">
            <Link href="/courts" asChild>
              <Button title="Back to Courts" variant="secondary" />
            </Link>
          </View>
        </View>
      ) : loading ? (
        <View className="px-6 py-6">
          <View className="h-6 w-48 rounded-lg bg-gray-200 dark:bg-white/10" />
          <View className="mt-3 h-4 w-64 rounded-lg bg-gray-100 dark:bg-white/5" />
          <View className="mt-6 h-32 rounded-2xl bg-gray-100 dark:bg-white/5" />
        </View>
      ) : error ? (
        <View className="px-6 py-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Court Details</Text>
          <Text className="mt-2 text-gray-600 dark:text-white/70">Error: {error}</Text>
          <View className="mt-6">
            <Button title="Retry" onPress={loadCourt} variant="secondary" />
          </View>
        </View>
      ) : court ? (
        <View className="flex-1">
          {/* Hero Header */}
          <View className="px-6 pb-4" style={{ paddingTop: insets.top + 4 }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Pressable
                onPress={() => router.back()}
                className="h-11 w-11 items-center justify-center rounded-full bg-gray-200 dark:bg-white/10"
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Text className="text-xl text-gray-900 dark:text-white">←</Text>
              </Pressable>
              {saved && (
                <View className="rounded-full bg-vibrant-gold/20 px-3 py-1">
                  <Text className="text-xs font-semibold text-vibrant-gold">⭐ Saved</Text>
                </View>
              )}
            </View>

            <Text className="text-3xl font-extrabold text-gray-900 dark:text-white">{court.name}</Text>
            <View className="mt-2 h-1 w-20 rounded-full bg-brand" />

            {court.address && (
              <Text className="mt-3 text-base text-gray-500 dark:text-white/60">
                📍 {formatAddress(court)}
              </Text>
            )}

            {/* Court Type & Hoops */}
            <View className="mt-4 flex-row flex-wrap">
              <View
                className={`mr-2 mb-2 rounded-xl px-4 py-2 ${
                  court.indoor ? 'bg-secondary' : 'bg-court'
                }`}
              >
                <Text className="font-semibold text-white">
                  {court.indoor ? '🏠 Indoor' : '🌤️ Outdoor'}
                </Text>
              </View>

              {court.num_hoops != null && (
                <View className="mr-2 mb-2 rounded-xl bg-gray-200 dark:bg-white/10 px-4 py-2">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    🏀 {court.num_hoops} {court.num_hoops === 1 ? 'Hoop' : 'Hoops'}
                  </Text>
                </View>
              )}

              {court.lighting != null && (
                <View className="mb-2 rounded-xl bg-gray-200 dark:bg-white/10 px-4 py-2">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    {court.lighting ? '💡 Lit' : '🌙 No Lights'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Live Activity Banner */}
          {supabaseStatus.configured && (
            <View className="mx-6 mt-4 overflow-hidden rounded-2xl border border-brand/30 bg-brand/10">
              <View className="flex-row items-center px-4 py-4">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-brand/30">
                  <Text className="text-2xl">
                    {checkInsCount === 0 ? '🏀' : '🔥'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 dark:text-white">
                    {checkInsCount === 0
                      ? 'No one here yet'
                      : checkInsCount === 1
                        ? '1 person here now'
                        : `${checkInsCount} people here now`}
                  </Text>
                  <Text className="mt-0.5 text-sm text-gray-600 dark:text-white/60">
                    {checkInsCount === 0
                      ? 'Be the first to check in!'
                      : 'Game on! 🏀'}
                  </Text>
                </View>
                {checkInsCount > 0 && (
                  <Animated.View
                    className="ml-2 h-3 w-3 rounded-full bg-status-active"
                    style={{ opacity: pulseAnim }}
                  />
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="mt-6 px-6">
            {supabaseStatus.configured && (
              <Pressable
                onPress={handleToggleCheckIn}
                disabled={checkInLoading}
                className={`mb-3 rounded-2xl py-4 ${
                  isUserCheckedIn
                    ? 'bg-court'
                    : 'bg-brand'
                } ${checkInLoading ? 'opacity-50' : ''}`}
                accessibilityLabel={isUserCheckedIn ? 'Check out from this court' : 'Check in at this court'}
                accessibilityRole="button"
                accessibilityState={{ disabled: checkInLoading }}
              >
                <View className="flex-row items-center justify-center">
                  {!checkInLoading && (
                    <View className="mr-2">
                      <Ionicons
                        name={isUserCheckedIn ? 'checkmark-circle' : 'basketball'}
                        size={24}
                        color="#ffffff"
                      />
                    </View>
                  )}
                  <Text className="text-center text-lg font-bold text-white">
                    {checkInLoading
                      ? 'Loading...'
                      : isUserCheckedIn
                        ? 'Checked In'
                        : "I'm Here"}
                  </Text>
                </View>
              </Pressable>
            )}

            <View className="flex-row">
              <Pressable
                onPress={handleGetDirections}
                className="mr-3 flex-1 items-center py-3"
                accessibilityLabel={`Get directions to ${court.name}`}
                accessibilityRole="button"
              >
                <Ionicons name="navigate-outline" size={26} color="#960000" />
                <Text className="mt-1 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Directions
                </Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleSavedCourt(court.id);
                }}
                className="flex-1 items-center py-3"
                accessibilityLabel={saved ? `Remove ${court.name} from saved courts` : `Save ${court.name} to favorites`}
                accessibilityRole="button"
                accessibilityState={{ selected: saved }}
              >
                <Ionicons
                  name={saved ? "bookmark" : "bookmark-outline"}
                  size={26}
                  color={saved ? "#FFD700" : "#960000"}
                />
                <Text
                  className={`mt-1 text-center text-sm font-semibold ${
                    saved ? 'text-vibrant-gold' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {saved ? 'Saved' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Photo Gallery */}
          {supabaseStatus.configured && courtId && (
            <View className="mt-6">
              <PhotoGallery
                key={photoRefreshKey}
                courtId={courtId}
                onPhotoDeleted={() => setPhotoRefreshKey(prev => prev + 1)}
              />
            </View>
          )}

          {/* Photo Upload */}
          {supabaseStatus.configured && courtId && (
            <View className="mt-6 px-6">
              <PhotoUpload
                courtId={courtId}
                onUploadSuccess={() => {
                  // Trigger photo gallery refresh
                  setPhotoRefreshKey(prev => prev + 1);
                }}
              />
            </View>
          )}

          {/* Additional Details */}
          <View className="mt-6 px-6 pb-8">
            <Text className="mb-3 text-lg font-bold text-gray-900 dark:text-white">Details</Text>

            {court.surface_type && (
              <View className="mb-3 flex-row items-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <View className="mr-3">
                  <Ionicons name="basketball" size={24} color={isDark ? '#ffffff' : '#1f2937'} />
                </View>
                <View>
                  <Text className="text-xs text-gray-400 dark:text-white/50">Surface</Text>
                  <Text className="mt-0.5 font-medium text-gray-900 dark:text-white">
                    {court.surface_type}
                  </Text>
                </View>
              </View>
            )}

            {court.open_24h != null && (
              <View className="mb-3 flex-row items-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <View className="mr-3">
                  <Ionicons name="time-outline" size={24} color={isDark ? '#ffffff' : '#1f2937'} />
                </View>
                <View>
                  <Text className="text-xs text-gray-400 dark:text-white/50">Hours</Text>
                  <Text className="mt-0.5 font-medium text-gray-900 dark:text-white">
                    {court.open_24h ? 'Open 24 hours' : formatHours(court.hours_json)}
                  </Text>
                </View>
              </View>
            )}

            {(court.city || court.state) && (
              <View className="mb-3 flex-row items-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <View className="mr-3">
                  <Ionicons name="location" size={24} color={isDark ? '#ffffff' : '#1f2937'} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 dark:text-white/50">Location</Text>
                  <Text className="mt-0.5 font-medium text-gray-900 dark:text-white" numberOfLines={2}>
                    {[court.city, court.state, court.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => setShowReportModal(true)}
              className="mt-2 items-center py-3"
              accessibilityLabel="Report an issue with this court"
              accessibilityRole="button"
            >
              <Text className="text-sm text-gray-400 dark:text-white/40">Report an issue</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Court Details</Text>
          <Text className="mt-2 text-gray-600 dark:text-white/70">Court not found.</Text>
          <View className="mt-6">
            <Link href="/courts" asChild>
              <Button title="Back to Courts" variant="secondary" />
            </Link>
          </View>
        </View>
      )}
    </ScrollView>

    {court && (
      <ReportModal
        visible={showReportModal}
        court={court}
        onClose={() => setShowReportModal(false)}
      />
    )}
    </>
  );
}
