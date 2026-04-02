import React from "react";
import { View, Pressable, ScrollView, ActivityIndicator, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/src/components/ui/Text";
import { Button } from "@/src/components/ui/Button";
import { Avatar } from "@/src/components/Avatar";
import { hydrateSavedCourts, subscribeSavedCourts } from "@/src/services/savedCourts";
import { getUserCheckInCount, getUserCheckInHistory } from "@/src/services/checkins";
import type { CheckInHistoryItem } from "@/src/types/checkins";
import { useAuth } from "@/src/context/AuthContext";
import { PLAY_STYLE_LABELS, SKILL_LEVEL_LABELS } from "@/src/types/user";

function formatCheckInTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return `Yesterday · ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  if (diffDays < 7) return `${diffDays}d ago · ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [savedCount, setSavedCount] = React.useState(0);
  const [checkInCount, setCheckInCount] = React.useState<number | null>(null);
  const [checkInHistory, setCheckInHistory] = React.useState<CheckInHistoryItem[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#1f2937";
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    hydrateSavedCourts();
    return subscribeSavedCourts((ids) => setSavedCount(ids.length));
  }, []);

  React.useEffect(() => {
    if (user?.id) {
      getUserCheckInCount(user.id).then(setCheckInCount);
      getUserCheckInHistory(user.id).then(setCheckInHistory);
    } else {
      setCheckInCount(null);
      setCheckInHistory([]);
    }
  }, [user?.id]);

  const displayName = profile?.username ?? user?.email?.split("@")[0] ?? "Player";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear().toString()
    : null;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header row */}
      <View
        className="flex-row items-center justify-between px-6"
        style={{ paddingTop: insets.top + 20 }}
      >
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Profile</Text>
        <Pressable
          onPress={() => router.push("/settings" as never)}
          hitSlop={8}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={22} color={isDark ? "#fff" : "#111"} />
        </Pressable>
      </View>

      {authLoading ? (
        <View className="mt-10 items-center">
          <ActivityIndicator color="#960000" />
        </View>
      ) : user ? (
        <>
          {/* Hero card */}
          <View className="mx-6 mt-5 rounded-3xl bg-gray-950 dark:bg-white/5 border border-white/10 overflow-hidden">
            {/* Top accent bar */}
            <View className="h-1 bg-red-900" />

            <View className="p-5">
              {/* Avatar + name */}
              <View className="flex-row items-center gap-4">
                <Avatar
                  uri={profile?.avatar_url}
                  initials={initials}
                  size={64}
                  editable
                  showOverlay={false}
                  onPress={() => router.push("/setup-profile" as never)}
                />
                <View className="flex-1">
                  <Text className="text-white font-bold text-xl" numberOfLines={1}>
                    {displayName}
                  </Text>
                </View>
              </View>

              {/* Badges */}
              {(profile?.play_style?.length || profile?.skill_level) ? (
                <View className="flex-row flex-wrap gap-2 mt-4">
                  {profile.play_style?.map((style) => (
                    <View key={style} className="rounded-full bg-red-900/30 border border-red-900/50 px-3 py-1">
                      <Text className="text-xs font-semibold text-red-400">
                        {PLAY_STYLE_LABELS[style]}
                      </Text>
                    </View>
                  ))}
                  {profile.skill_level ? (
                    <View className="rounded-full bg-white/10 border border-white/10 px-3 py-1">
                      <Text className="text-xs font-semibold text-white/60">
                        {SKILL_LEVEL_LABELS[profile.skill_level]}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Stats row */}
              <View className="flex-row mt-5 pt-4 border-t border-white/10">
                {checkInCount !== null ? (
                  <View className="flex-1 items-center">
                    <Text className="text-white font-bold text-2xl">{checkInCount}</Text>
                    <Text className="text-white/40 text-xs mt-0.5">Check-ins</Text>
                  </View>
                ) : null}
                <View className="flex-1 items-center">
                  <Text className="text-white font-bold text-2xl">{savedCount}</Text>
                  <Text className="text-white/40 text-xs mt-0.5">Saved</Text>
                </View>
                {memberSince ? (
                  <View className="flex-1 items-center">
                    <Text className="text-white font-bold text-2xl">{memberSince}</Text>
                    <Text className="text-white/40 text-xs mt-0.5">Member Since</Text>
                  </View>
                ) : null}
              </View>

              {/* Edit profile */}
              <Pressable
                onPress={() => router.push("/setup-profile" as never)}
                className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5"
                accessibilityLabel="Edit profile"
                accessibilityRole="button"
              >
                <Ionicons name="pencil-outline" size={14} color="rgba(255,255,255,0.5)" />
                <Text className="text-sm text-white/50">Edit Profile</Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : (
        /* Signed-out CTA */
        <Pressable
          onPress={() => router.push("/sign-in" as never)}
          className="mx-6 mt-5 rounded-3xl bg-red-900 px-5 py-6 items-center"
          accessibilityLabel="Sign in to your account"
          accessibilityRole="button"
        >
          <Ionicons name="person-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
          <Text className="text-white font-bold text-lg mt-3">Sign in</Text>
          <Text className="text-white/60 text-sm mt-1 text-center">
            Sync saved courts across devices
          </Text>
        </Pressable>
      )}

      {/* Check-in activity */}
      {user && checkInHistory.length > 0 && (
        <View className="mx-6 mt-6">
          <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3">
            Recent Activity
          </Text>
          <View className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {checkInHistory.map((item, i) => (
              <Pressable
                key={`${item.court_id}-${item.checked_in_at}`}
                onPress={() => router.push(`/court/${item.court_id}` as never)}
                className={`flex-row items-center px-4 py-3.5 gap-3 bg-white dark:bg-black active:opacity-70 ${
                  i < checkInHistory.length - 1 ? "border-b border-gray-100 dark:border-white/10" : ""
                }`}
              >
                <View className="w-9 h-9 rounded-full bg-red-700/10 dark:bg-red-700/20 items-center justify-center">
                  <Ionicons name="basketball" size={16} color="#960000" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
                    {item.court_name}
                  </Text>
                  {item.court_address ? (
                    <Text className="text-xs text-gray-500 dark:text-white/40 mt-0.5" numberOfLines={1}>
                      {item.court_address}
                    </Text>
                  ) : null}
                </View>
                <View className="items-end gap-1">
                  {item.is_active ? (
                    <View className="flex-row items-center gap-1">
                      <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <Text className="text-xs font-medium text-green-600 dark:text-green-400">Active</Text>
                    </View>
                  ) : (
                    <Text className="text-xs text-gray-400 dark:text-white/30">
                      {formatCheckInTime(item.checked_in_at)}
                    </Text>
                  )}
                  <Ionicons name="chevron-forward" size={14} color={isDark ? "rgba(255,255,255,0.2)" : "#d1d5db"} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Quick links */}
      <View className="mx-6 mt-5 gap-3">
        <Link href="/saved" asChild>
          <Button
            title={`Saved Courts (${savedCount})`}
            variant="secondary"
            icon={<Ionicons name="bookmark" size={20} color={iconColor} />}
            accessibilityLabel={`View saved courts, ${savedCount} saved`}
            accessibilityRole="button"
            testID="saved-courts-button"
          />
        </Link>
        <Link href="/courts" asChild>
          <Button
            title="Browse Courts"
            variant="secondary"
            icon={<Ionicons name="basketball" size={20} color={iconColor} />}
            accessibilityLabel="Browse all courts"
            accessibilityRole="button"
          />
        </Link>
        <Link href="/submit-court" asChild>
          <Button
            title="Submit a Court"
            variant="secondary"
            icon={<Ionicons name="add-circle" size={20} color={iconColor} />}
            accessibilityLabel="Submit a new court"
            accessibilityRole="button"
          />
        </Link>
      </View>
    </ScrollView>
  );
}
