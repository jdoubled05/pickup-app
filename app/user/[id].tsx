import React from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Text } from "@/src/components/ui/Text";
import { Avatar } from "@/src/components/Avatar";
import { useAuth } from "@/src/context/AuthContext";
import {
  getUserPublicProfile,
  getUserActiveCheckIn,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "@/src/services/friends";
import type { UserPublicProfile, ActiveCheckIn } from "@/src/services/friends";
import { getUserCheckInHistory } from "@/src/services/checkins";
import type { CheckInHistoryItem } from "@/src/types/checkins";
import { PLAY_STYLE_LABELS, SKILL_LEVEL_LABELS } from "@/src/types/user";
import type { PlayStyle, SkillLevel } from "@/src/types/user";

function memberSince(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

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

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();

  const [profile, setProfile] = React.useState<UserPublicProfile | null>(null);
  const [activeCheckIn, setActiveCheckIn] = React.useState<ActiveCheckIn | null>(null);
  const [checkInHistory, setCheckInHistory] = React.useState<CheckInHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    Promise.all([
      getUserPublicProfile(id),
      getUserActiveCheckIn(id),
      getUserCheckInHistory(id),
    ]).then(([p, ci, history]) => {
      setProfile(p);
      setActiveCheckIn(ci);
      setCheckInHistory(history);
      setLoading(false);
    });
  }, [id]);

  const handleFriendAction = async () => {
    if (!profile) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActionLoading(true);

    try {
      if (!profile.friendship_status) {
        const f = await sendFriendRequest(profile.id);
        if (f) {
          setProfile((p) =>
            p ? { ...p, friendship_id: f.id, friendship_status: "pending", is_requester: true } : p
          );
        }
      } else if (profile.friendship_status === "pending" && !profile.is_requester) {
        const ok = await acceptFriendRequest(profile.friendship_id!);
        if (ok) setProfile((p) => p ? { ...p, friendship_status: "accepted" } : p);
      } else if (profile.friendship_status === "accepted") {
        Alert.alert("Remove Friend", `Remove ${profile.username} from your friends?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              const ok = await removeFriend(profile.friendship_id!);
              if (ok) setProfile((p) => p ? { ...p, friendship_id: null, friendship_status: null, is_requester: null } : p);
            },
          },
        ]);
      } else if (profile.friendship_status === "pending" && profile.is_requester) {
        // Cancel sent request
        const ok = await removeFriend(profile.friendship_id!);
        if (ok) setProfile((p) => p ? { ...p, friendship_id: null, friendship_status: null, is_requester: null } : p);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const friendButtonLabel = (): string => {
    if (!profile?.friendship_status) return "Add Friend";
    if (profile.friendship_status === "accepted") return "Friends";
    if (profile.friendship_status === "pending" && profile.is_requester) return "Request Sent";
    if (profile.friendship_status === "pending" && !profile.is_requester) return "Accept Request";
    return "Add Friend";
  };

  const friendButtonStyle = (): string => {
    if (profile?.friendship_status === "accepted") return "border border-gray-300 dark:border-white/20";
    if (profile?.friendship_status === "pending" && profile.is_requester) return "border border-gray-300 dark:border-white/20";
    return "bg-red-700";
  };

  const friendButtonTextStyle = (): string => {
    if (profile?.friendship_status === "accepted") return "text-gray-700 dark:text-white/80";
    if (profile?.friendship_status === "pending" && profile.is_requester) return "text-gray-500 dark:text-white/50";
    return "text-white";
  };

  const isOwnProfile = user?.id === id;

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-black items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#960000" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-white dark:bg-black items-center justify-center px-6" style={{ paddingTop: insets.top }}>
        <Pressable onPress={() => router.back()} className="absolute top-6 left-4" hitSlop={8} style={{ top: insets.top + 16 }}>
          <Ionicons name="chevron-back" size={24} color={isDark ? "#fff" : "#000"} />
        </Pressable>
        <Text className="text-gray-500 dark:text-white/40">Player not found</Text>
      </View>
    );
  }

  const initials = profile.username.slice(0, 2).toUpperCase();

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
        {/* Hero */}
        <View className="items-center pt-14 pb-6 px-6">
          <Avatar uri={profile.avatar_url} initials={initials} size={88} />
          <Text className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {profile.username}
          </Text>
          {profile.skill_level && (
            <Text className="mt-1 text-gray-500 dark:text-white/50 capitalize">
              {SKILL_LEVEL_LABELS[profile.skill_level as SkillLevel] ?? profile.skill_level}
            </Text>
          )}
          <Text className="mt-1 text-xs text-gray-400 dark:text-white/30">
            Member since {memberSince(profile.created_at)}
          </Text>

          {/* Friend action — hidden on own profile */}
          {!isOwnProfile && user && (
            <Pressable
              onPress={handleFriendAction}
              disabled={actionLoading}
              className={`mt-5 flex-row items-center gap-2 rounded-full px-6 py-2.5 ${friendButtonStyle()}`}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={profile?.friendship_status ? (isDark ? "#fff" : "#374151") : "#fff"} />
              ) : (
                <>
                  <Ionicons
                    name={
                      profile.friendship_status === "accepted"
                        ? "checkmark"
                        : profile.friendship_status === "pending" && profile.is_requester
                        ? "time-outline"
                        : profile.friendship_status === "pending" && !profile.is_requester
                        ? "person-add-outline"
                        : "person-add-outline"
                    }
                    size={16}
                    color={
                      profile.friendship_status === "accepted"
                        ? isDark ? "rgba(255,255,255,0.8)" : "#374151"
                        : profile.friendship_status === "pending" && profile.is_requester
                        ? isDark ? "rgba(255,255,255,0.5)" : "#9ca3af"
                        : "#fff"
                    }
                  />
                  <Text className={`font-semibold ${friendButtonTextStyle()}`}>
                    {friendButtonLabel()}
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {/* Incoming request actions */}
          {!isOwnProfile && user && profile.friendship_status === "pending" && !profile.is_requester && (
            <Pressable
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const ok = await declineFriendRequest(profile.friendship_id!);
                if (ok) setProfile((p) => p ? { ...p, friendship_id: null, friendship_status: null, is_requester: null } : p);
              }}
              className="mt-2"
            >
              <Text className="text-sm text-gray-400 dark:text-white/30">Decline</Text>
            </Pressable>
          )}
        </View>

        {/* Active check-in */}
        {activeCheckIn && (
          <View className="mx-4 mb-4">
            <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3 px-2">
              Playing Now
            </Text>
            <Pressable
              onPress={() => router.push(`/court/${activeCheckIn.court_id}`)}
              className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3.5 flex-row items-center gap-3 active:opacity-70"
            >
              <View className="w-9 h-9 rounded-full bg-red-700/10 dark:bg-red-700/20 items-center justify-center">
                <Ionicons name="basketball" size={18} color="#960000" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 dark:text-white">
                  {activeCheckIn.court_name}
                </Text>
                {activeCheckIn.court_address && (
                  <Text className="text-xs text-gray-500 dark:text-white/50 mt-0.5" numberOfLines={1}>
                    {activeCheckIn.court_address}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? "rgba(255,255,255,0.3)" : "#9ca3af"} />
            </Pressable>
          </View>
        )}

        {/* Play Styles */}
        {profile.play_style && profile.play_style.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3 px-2">
              Play Style
            </Text>
            <View className="flex-row flex-wrap gap-2 px-2">
              {profile.play_style.map((style) => (
                <View
                  key={style}
                  className="rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 px-4 py-1.5"
                >
                  <Text className="text-sm text-gray-700 dark:text-white/80">
                    {PLAY_STYLE_LABELS[style as PlayStyle] ?? style}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        {checkInHistory.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3 px-2">
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
      </ScrollView>
    </View>
  );
}
