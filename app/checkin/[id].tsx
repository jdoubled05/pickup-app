import React from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/src/components/ui/Text";
import { Avatar } from "@/src/components/Avatar";
import { getCheckInDetail } from "@/src/services/checkins";
import type { CheckInDetailData } from "@/src/types/checkins";
import { formatDuration } from "@/src/utils/checkinFormatting";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + " · " + date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CheckInDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [detail, setDetail] = React.useState<CheckInDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    getCheckInDetail(id).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View
        className="flex-1 bg-white dark:bg-black items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color="#960000" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View
        className="flex-1 bg-white dark:bg-black items-center justify-center px-6"
        style={{ paddingTop: insets.top }}
      >
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4"
          style={{ top: insets.top + 16 }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? "#fff" : "#000"} />
        </Pressable>
        <Text className="text-gray-500 dark:text-white/40">Check-in not found</Text>
      </View>
    );
  }

  const isActive = detail.is_active;
  const isManual = detail.is_manual_checkout === true;

  // Duration is meaningful whenever we have created_at (so checked_in_at is accurate)
  const showDuration = !isActive || detail.is_manual_checkout !== null;

  return (
    <View className="flex-1 bg-white dark:bg-black" style={{ paddingTop: insets.top }}>
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="absolute z-10 left-4"
        style={{ top: insets.top + 16 }}
      >
        <Ionicons name="chevron-back" size={24} color={isDark ? "#fff" : "#000"} />
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="pt-14 pb-2 px-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white" numberOfLines={2}>
            {detail.court_name}
          </Text>
          {detail.court_address ? (
            <Text className="mt-1 text-sm text-gray-500 dark:text-white/40" numberOfLines={1}>
              {detail.court_address}
            </Text>
          ) : null}
        </View>

        {/* Status badge */}
        <View className="px-6 mb-5">
          {isActive ? (
            <View className="flex-row items-center gap-1.5 mt-2">
              <View className="w-2 h-2 rounded-full bg-green-500" />
              <Text className="text-sm font-semibold text-green-600 dark:text-green-400">
                Currently checked in
              </Text>
            </View>
          ) : null}
        </View>

        {/* Timeline card */}
        <View className="mx-6 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden mb-5">
          {/* Check-in row */}
          <View className="flex-row items-center gap-4 px-4 py-4 border-b border-gray-100 dark:border-white/10">
            <View className="w-8 h-8 rounded-full bg-green-500/10 items-center justify-center">
              <Ionicons name="log-in-outline" size={16} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-0.5">
                Checked in
              </Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDateTime(detail.checked_in_at)}
              </Text>
            </View>
          </View>

          {/* Checkout row */}
          <View className="flex-row items-center gap-4 px-4 py-4">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                isActive
                  ? "bg-gray-100 dark:bg-white/5"
                  : isManual
                  ? "bg-red-700/10"
                  : "bg-gray-100 dark:bg-white/10"
              }`}
            >
              <Ionicons
                name={isActive ? "time-outline" : "log-out-outline"}
                size={16}
                color={
                  isActive
                    ? isDark ? "rgba(255,255,255,0.3)" : "#9ca3af"
                    : isManual
                    ? "#960000"
                    : isDark ? "rgba(255,255,255,0.5)" : "#6b7280"
                }
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-0.5">
                {isActive ? "Expires" : isManual ? "Checked out" : "Auto checkout"}
              </Text>
              {isActive ? (
                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDateTime(detail.expires_at)}
                </Text>
              ) : isManual ? (
                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDateTime(detail.expires_at)}
                </Text>
              ) : (
                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDateTime(detail.expires_at)}
                </Text>
              )}
            </View>
          </View>

          {/* Duration footer */}
          {showDuration && (
            <View className="px-4 py-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10">
              <Text className="text-xs text-gray-400 dark:text-white/30 text-center">
                {isActive
                  ? `Active for ${formatDuration(detail.checked_in_at, new Date().toISOString())}`
                  : `Session · ${formatDuration(detail.checked_in_at, detail.expires_at)}`}
              </Text>
            </View>
          )}
        </View>

        {/* Friends at court */}
        {detail.friends_at_court.length > 0 && (
          <View className="mx-6 mb-5">
            <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3">
              Friends there with you
            </Text>
            <View className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              {detail.friends_at_court.map((friend, i) => {
                const initials = friend.username.slice(0, 2).toUpperCase();
                return (
                  <Pressable
                    key={friend.user_id}
                    onPress={() => router.push(`/user/${friend.user_id}` as never)}
                    className={`flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-black active:opacity-70 ${
                      i < detail.friends_at_court.length - 1
                        ? "border-b border-gray-100 dark:border-white/10"
                        : ""
                    }`}
                  >
                    <Avatar uri={friend.avatar_url} initials={initials} size={36} />
                    <Text className="flex-1 font-semibold text-gray-900 dark:text-white">
                      {friend.username}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={isDark ? "rgba(255,255,255,0.2)" : "#d1d5db"}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* View court button */}
        <View className="mx-6">
          <Pressable
            onPress={() => router.push(`/court/${detail.court_id}` as never)}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 py-3"
          >
            <Ionicons
              name="basketball-outline"
              size={16}
              color={isDark ? "rgba(255,255,255,0.5)" : "#6b7280"}
            />
            <Text className="text-sm text-gray-500 dark:text-white/50 font-medium">
              View Court
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
