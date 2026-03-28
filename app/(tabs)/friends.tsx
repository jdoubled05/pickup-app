import React from "react";
import {
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  useColorScheme,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Text } from "@/src/components/ui/Text";
import { Avatar } from "@/src/components/Avatar";
import { useAuth } from "@/src/context/AuthContext";
import {
  getFriends,
  getPendingRequests,
  getFriendActivity,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  subscribeToFriendActivity,
  subscribeToFriendRequests,
} from "@/src/services/friends";
import type { FriendWithProfile, FriendActivity } from "@/src/types/friends";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();

  const [activity, setActivity] = React.useState<FriendActivity[]>([]);
  const [friends, setFriends] = React.useState<FriendWithProfile[]>([]);
  const [requests, setRequests] = React.useState<FriendWithProfile[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [requestsExpanded, setRequestsExpanded] = React.useState(true);

  const loadAll = React.useCallback(async () => {
    const [a, f, r] = await Promise.all([
      getFriendActivity(),
      getFriends(),
      getPendingRequests(),
    ]);
    setActivity(a);
    setFriends(f);
    setRequests(r);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    loadAll();
    const unsubActivity = subscribeToFriendActivity(setActivity);
    const unsubRequests = subscribeToFriendRequests(setRequests);
    return () => {
      unsubActivity();
      unsubRequests();
    };
  }, [user, loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleAccept = async (friendshipId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await acceptFriendRequest(friendshipId);
    if (ok) loadAll();
  };

  const handleDecline = async (friendshipId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await declineFriendRequest(friendshipId);
    if (ok) setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  const handleRemoveFriend = (item: FriendWithProfile) => {
    Alert.alert(
      "Remove Friend",
      `Remove ${item.friend.username} from your friends?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const ok = await removeFriend(item.id);
            if (ok) setFriends((prev) => prev.filter((f) => f.id !== item.id));
          },
        },
      ]
    );
  };

  const iconColor = isDark ? "#fff" : "#1f2937";

  if (!user) {
    return (
      <View
        className="flex-1 bg-white dark:bg-black items-center justify-center px-6"
        style={{ paddingTop: insets.top }}
      >
        <Ionicons
          name="people-outline"
          size={48}
          color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
        />
        <Text className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          Sign in to use Friends
        </Text>
        <Text className="mt-2 text-center text-gray-500 dark:text-white/50">
          Create an account to add friends and see where they're playing.
        </Text>
        <Pressable
          onPress={() => router.push("/sign-in")}
          className="mt-6 bg-red-700 rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerStyle={{ paddingBottom: 32 }}
      style={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-6 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Friends
        </Text>
        <Pressable
          onPress={() => router.push("/friend-search")}
          hitSlop={8}
          className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-white/10 rounded-full px-3 py-1.5"
        >
          <Ionicons name="person-add-outline" size={16} color={isDark ? "#fff" : "#374151"} />
          <Text className="text-sm font-medium text-gray-700 dark:text-white">
            Add
          </Text>
        </Pressable>
      </View>

      {/* Friend Requests */}
      {requests.length > 0 && (
        <View className="mx-4 mt-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 overflow-hidden">
          <Pressable
            onPress={() => setRequestsExpanded((v) => !v)}
            className="flex-row items-center justify-between px-4 py-3"
          >
            <View className="flex-row items-center gap-2">
              <View className="bg-red-700 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {requests.length}
                </Text>
              </View>
              <Text className="font-semibold text-gray-900 dark:text-white">
                Friend{requests.length !== 1 ? " Requests" : " Request"}
              </Text>
            </View>
            <Ionicons
              name={requestsExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"}
            />
          </Pressable>

          {requestsExpanded &&
            requests.map((req, i) => (
              <View
                key={req.id}
                className={`flex-row items-center px-4 py-3 gap-3 ${
                  i < requests.length - 1
                    ? "border-t border-gray-200 dark:border-white/10"
                    : ""
                }`}
              >
                <Avatar
                  uri={req.friend.avatar_url}
                  initials={req.friend.username.slice(0, 2).toUpperCase()}
                  size={40}
                />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    {req.friend.username}
                  </Text>
                  {req.friend.skill_level && (
                    <Text className="text-xs text-gray-500 dark:text-white/50 capitalize">
                      {req.friend.skill_level}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => handleDecline(req.id)}
                  className="rounded-full border border-gray-300 dark:border-white/20 px-3 py-1.5 mr-2"
                  hitSlop={4}
                >
                  <Text className="text-sm text-gray-600 dark:text-white/70">
                    Decline
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAccept(req.id)}
                  className="rounded-full bg-red-700 px-3 py-1.5"
                  hitSlop={4}
                >
                  <Text className="text-sm text-white font-semibold">
                    Accept
                  </Text>
                </Pressable>
              </View>
            ))}
        </View>
      )}

      {/* Playing Now */}
      <View className="px-4 mt-6">
        <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3 px-2">
          Playing Now
        </Text>

        {activity.length === 0 ? (
          <View className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 items-center py-10 px-6">
            <Ionicons
              name="basketball-outline"
              size={36}
              color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
            />
            <Text className="mt-3 text-gray-500 dark:text-white/40 text-center">
              {friends.length === 0
                ? "Add friends to see where they're playing"
                : "None of your friends are checked in right now"}
            </Text>
          </View>
        ) : (
          <View className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {activity.map((item, i) => (
              <Pressable
                key={`${item.friend_id}-${item.court_id}`}
                onPress={() => router.push(`/court/${item.court_id}`)}
                className={`flex-row items-center px-4 py-3.5 gap-3 bg-white dark:bg-black active:opacity-70 ${
                  i < activity.length - 1
                    ? "border-b border-gray-100 dark:border-white/10"
                    : ""
                }`}
              >
                <Avatar
                  uri={item.friend_avatar_url}
                  initials={item.friend_username.slice(0, 2).toUpperCase()}
                  size={44}
                />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    {item.friend_username}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color={isDark ? "rgba(255,255,255,0.5)" : "#6b7280"}
                    />
                    <Text
                      className="text-sm text-gray-500 dark:text-white/50"
                      numberOfLines={1}
                    >
                      {item.court_name}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-400 dark:text-white/30">
                  {timeAgo(item.checked_in_at)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Friends List */}
      <View className="px-4 mt-6">
        <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3 px-2">
          Friends {friends.length > 0 ? `· ${friends.length}` : ""}
        </Text>

        {friends.length === 0 ? (
          <View className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 items-center py-8 px-6">
            <Text className="text-gray-500 dark:text-white/40 text-center">
              No friends yet
            </Text>
            <Pressable
              onPress={() => router.push("/friend-search")}
              className="mt-3 flex-row items-center gap-1.5"
            >
              <Ionicons name="person-add-outline" size={14} color="#960000" />
              <Text className="text-red-700 text-sm font-medium">
                Find players to add
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {friends.map((item, i) => (
              <View
                key={item.id}
                className={`flex-row items-center px-4 py-3.5 gap-3 bg-white dark:bg-black ${
                  i < friends.length - 1
                    ? "border-b border-gray-100 dark:border-white/10"
                    : ""
                }`}
              >
                <Avatar
                  uri={item.friend.avatar_url}
                  initials={item.friend.username.slice(0, 2).toUpperCase()}
                  size={44}
                />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    {item.friend.username}
                  </Text>
                  {item.friend.skill_level && (
                    <Text className="text-xs text-gray-500 dark:text-white/50 capitalize">
                      {item.friend.skill_level}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => handleRemoveFriend(item)}
                  hitSlop={8}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={18}
                    color={iconColor}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
