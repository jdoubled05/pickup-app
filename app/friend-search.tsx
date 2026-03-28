import React from "react";
import {
  View,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Text } from "@/src/components/ui/Text";
import { Avatar } from "@/src/components/Avatar";
import { searchUsers, sendFriendRequest, removeFriend } from "@/src/services/friends";
import type { UserSearchResult } from "@/src/types/friends";

export default function FriendSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<UserSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set());

  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchUsers(text);
      setResults(data);
      setLoading(false);
    }, 350);
  };

  const handleAdd = async (result: UserSearchResult) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingIds((prev) => new Set(prev).add(result.id));
    const friendship = await sendFriendRequest(result.id);
    if (friendship) {
      setResults((prev) =>
        prev.map((r) =>
          r.id === result.id
            ? {
                ...r,
                friendship_status: "pending",
                friendship_id: friendship.id,
                is_requester: true,
              }
            : r
        )
      );
    }
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(result.id);
      return next;
    });
  };

  const handleCancel = async (result: UserSearchResult) => {
    if (!result.friendship_id) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await removeFriend(result.friendship_id);
    if (ok) {
      setResults((prev) =>
        prev.map((r) =>
          r.id === result.id
            ? { ...r, friendship_status: null, friendship_id: null, is_requester: null }
            : r
        )
      );
    }
  };

  const renderStatus = (result: UserSearchResult) => {
    const isPending = pendingIds.has(result.id);

    if (isPending) {
      return <ActivityIndicator size="small" color="#960000" />;
    }

    if (result.friendship_status === "accepted") {
      return (
        <View className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/20">
          <Ionicons name="checkmark" size={14} color={isDark ? "#ffffff80" : "#6b7280"} />
          <Text className="text-sm text-gray-500 dark:text-white/50">Friends</Text>
        </View>
      );
    }

    if (result.friendship_status === "pending" && result.is_requester) {
      return (
        <Pressable
          onPress={() => handleCancel(result)}
          className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/20"
        >
          <Text className="text-sm text-gray-500 dark:text-white/50">Pending</Text>
        </Pressable>
      );
    }

    if (result.friendship_status === "pending" && !result.is_requester) {
      return (
        <View className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/20">
          <Text className="text-sm text-gray-500 dark:text-white/50">Sent you a request</Text>
        </View>
      );
    }

    return (
      <Pressable
        onPress={() => handleAdd(result)}
        className="px-3 py-1.5 rounded-full bg-red-700"
      >
        <Text className="text-sm text-white font-semibold">Add</Text>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white dark:bg-black"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pt-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </Pressable>
        <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-white/10 rounded-xl px-3 py-2.5 gap-2">
          <Ionicons
            name="search"
            size={16}
            color={isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"}
          />
          <TextInput
            autoFocus
            placeholder="Search by username"
            placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#9ca3af"}
            value={query}
            onChangeText={handleQueryChange}
            className="flex-1 text-gray-900 dark:text-white text-base"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(""); setResults([]); }} hitSlop={4}>
              <Ionicons
                name="close-circle"
                size={16}
                color={isDark ? "rgba(255,255,255,0.4)" : "#9ca3af"}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#960000" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
          ListEmptyComponent={
            query.trim().length >= 2 ? (
              <View className="items-center pt-16">
                <Text className="text-gray-400 dark:text-white/30">
                  No players found for "{query}"
                </Text>
              </View>
            ) : query.trim().length > 0 ? (
              <View className="items-center pt-16">
                <Text className="text-gray-400 dark:text-white/30">
                  Keep typing to search
                </Text>
              </View>
            ) : (
              <View className="items-center pt-16">
                <Ionicons
                  name="search-outline"
                  size={40}
                  color={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}
                />
                <Text className="mt-3 text-gray-400 dark:text-white/30">
                  Search for players by username
                </Text>
              </View>
            )
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => router.push(`/user/${item.id}`)}
              className={`flex-row items-center py-3 gap-3 active:opacity-70 ${
                index < results.length - 1
                  ? "border-b border-gray-100 dark:border-white/10"
                  : ""
              }`}
            >
              <Avatar
                uri={item.avatar_url}
                initials={item.username.slice(0, 2).toUpperCase()}
                size={44}
              />
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 dark:text-white">
                  {item.username}
                </Text>
                {item.skill_level && (
                  <Text className="text-xs text-gray-500 dark:text-white/50 capitalize">
                    {item.skill_level}
                  </Text>
                )}
              </View>
              <Pressable onPress={(e) => { e.stopPropagation(); }} hitSlop={4}>
                {renderStatus(item)}
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}
